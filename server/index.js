import express from 'express';
import cors from 'cors';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { uploadImage } from './cloudinary.js';
import { calculateForgeScore, checkAchievements } from './forge-score.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

// Initialize database tables
async function initDB() {
  const schema = `
    CREATE TABLE IF NOT EXISTS body_stats (id SERIAL PRIMARY KEY, weight NUMERIC(5,1), bf_percent NUMERIC(4,1), muscle_mass NUMERIC(5,1), visceral_fat NUMERIC(4,1), notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS meals (id SERIAL PRIMARY KEY, photo_url TEXT, meal_name TEXT, protein NUMERIC(5,1), carbs NUMERIC(5,1), fat NUMERIC(5,1), calories INTEGER, confidence TEXT DEFAULT 'medium', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS workouts (id SERIAL PRIMARY KEY, type TEXT, duration_mins INTEGER, calories_burned INTEGER, rounds INTEGER, intensity INTEGER, avg_heart_rate INTEGER, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ, source VARCHAR(20) DEFAULT 'manual', notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS inbody_results (id SERIAL PRIMARY KEY, weight NUMERIC(5,1), bf_percent NUMERIC(4,1), muscle_mass NUMERIC(5,1), visceral_fat NUMERIC(4,1), bmi NUMERIC(4,1), created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS progress_photos (id SERIAL PRIMARY KEY, photo_url TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS daily_log (id SERIAL PRIMARY KEY, date DATE DEFAULT CURRENT_DATE, water_oz INTEGER DEFAULT 0, bloat_score INTEGER, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS achievements (id SERIAL PRIMARY KEY, key TEXT UNIQUE, name TEXT, description TEXT, earned_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS forge_score_snapshots (id SERIAL PRIMARY KEY, score NUMERIC(5,1), bf_score NUMERIC(5,1), weight_score NUMERIC(5,1), consistency_score NUMERIC(5,1), workout_score NUMERIC(5,1), created_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS saved_meals (id SERIAL PRIMARY KEY, meal_name TEXT NOT NULL, protein NUMERIC(5,1), carbs NUMERIC(5,1), fat NUMERIC(5,1), calories INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());
  `;
  try {
    await pool.query(schema);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

app.use(compression());
app.use(cors());
app.use(express.json());

// ---- API ROUTES ----

// Body Stats
app.post('/api/body-stats', async (req, res) => {
  try {
    const { weight, bf_percent, muscle_mass, visceral_fat, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO body_stats (weight, bf_percent, muscle_mass, visceral_fat, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [weight, bf_percent, muscle_mass, visceral_fat, notes]
    );
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/body-stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM body_stats ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meals
app.post('/api/meals', upload.single('photo'), async (req, res) => {
  try {
    let photo_url = null;
    if (req.file) {
      const uploaded = await uploadImage(req.file.buffer);
      photo_url = uploaded.secure_url;
    }
    const { meal_name, protein, carbs, fat, calories, confidence, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO meals (photo_url, meal_name, protein, carbs, fat, calories, confidence, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [photo_url, meal_name, protein, carbs, fat, calories, confidence || 'medium', notes]
    );
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/meals', async (req, res) => {
  try {
    const { date } = req.query;
    let query = 'SELECT * FROM meals ORDER BY created_at DESC LIMIT 100';
    let params = [];
    if (date) {
      query = 'SELECT * FROM meals WHERE DATE(created_at) = $1 ORDER BY created_at DESC';
      params = [date];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Workouts
app.post('/api/workouts', async (req, res) => {
  try {
    const { type, duration_mins, calories_burned, rounds, intensity, avg_heart_rate, start_time, end_time, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO workouts (type, duration_mins, calories_burned, rounds, intensity, avg_heart_rate, start_time, end_time, source, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [type, duration_mins, calories_burned, rounds, intensity, avg_heart_rate, start_time, end_time, 'manual', notes]
    );
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apple Watch / Health sync endpoint
app.post('/api/workouts/sync', async (req, res) => {
  try {
    const { type, duration_mins, calories_burned, avg_heart_rate, start_time, end_time } = req.body;
    const result = await pool.query(
      'INSERT INTO workouts (type, duration_mins, calories_burned, avg_heart_rate, start_time, end_time, source) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [type, duration_mins, calories_burned, avg_heart_rate, start_time, end_time, 'apple_watch']
    );
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workouts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workouts ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// InBody
app.post('/api/inbody', async (req, res) => {
  try {
    const { weight, bf_percent, muscle_mass, visceral_fat, bmi } = req.body;
    const result = await pool.query(
      'INSERT INTO inbody_results (weight, bf_percent, muscle_mass, visceral_fat, bmi) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [weight, bf_percent, muscle_mass, visceral_fat, bmi]
    );
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inbody', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inbody_results ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Progress Photos
app.post('/api/progress-photos', upload.single('photo'), async (req, res) => {
  try {
    let photo_url = null;
    if (req.file) {
      const uploaded = await uploadImage(req.file.buffer);
      photo_url = uploaded.secure_url;
    }
    const { notes } = req.body;
    const result = await pool.query(
      'INSERT INTO progress_photos (photo_url, notes) VALUES ($1,$2) RETURNING *',
      [photo_url, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/progress-photos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progress_photos ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily Log
app.post('/api/daily-log', async (req, res) => {
  try {
    const { water_oz, bloat_score, notes } = req.body;
    // Upsert for today
    const existing = await pool.query('SELECT id, water_oz FROM daily_log WHERE date = CURRENT_DATE LIMIT 1');
    let result;
    if (existing.rows.length > 0) {
      const newWater = (parseInt(existing.rows[0].water_oz) || 0) + (parseInt(water_oz) || 0);
      result = await pool.query(
        'UPDATE daily_log SET water_oz = $1, bloat_score = COALESCE($2, bloat_score), notes = COALESCE($3, notes) WHERE date = CURRENT_DATE RETURNING *',
        [newWater, bloat_score, notes]
      );
    } else {
      result = await pool.query(
        'INSERT INTO daily_log (water_oz, bloat_score, notes) VALUES ($1,$2,$3) RETURNING *',
        [water_oz || 0, bloat_score, notes]
      );
    }
    checkAchievements().catch(() => {});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/daily-log/today', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_log WHERE date = CURRENT_DATE LIMIT 1');
    res.json(result.rows[0] || { water_oz: 0, bloat_score: null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forge Score
app.get('/api/forge-score', async (req, res) => {
  try {
    const score = await calculateForgeScore();
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forge-score/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM forge_score_snapshots ORDER BY created_at DESC LIMIT 52'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY earned_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meal Photo Analysis with Claude Vision
app.post('/api/analyze-meal', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype || 'image/jpeg';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            {
              type: 'text',
              text: 'Analyze this meal and return ONLY a JSON object: { "meal_name": "string", "protein_g": number, "carbs_g": number, "fat_g": number, "calories": number, "confidence": "low"|"medium"|"high" }. No other text.',
            },
          ],
        },
      ],
      system: 'You are a nutrition expert. Analyze meal photos and return precise macro estimates.',
    });

    const text = response.content[0].text.trim();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Could not parse AI response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Saved Meals
app.get('/api/saved-meals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_meals ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saved-meals', async (req, res) => {
  try {
    const { meal_name, protein, carbs, fat, calories } = req.body;
    const result = await pool.query(
      'INSERT INTO saved_meals (meal_name, protein, carbs, fat, calories) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [meal_name, protein, carbs, fat, calories]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saved-meals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_meals WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Text-based meal analysis with Claude Haiku
app.post('/api/analyze-meal-text', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'No description provided' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Analyze this meal description and return ONLY a JSON object: { "meal_name": "string", "protein_g": number, "carbs_g": number, "fat_g": number, "calories": number, "confidence": "low"|"medium"|"high" }. No other text.\n\nMeal: ${description}`,
        },
      ],
      system: 'You are a nutrition expert. Analyze meal descriptions and return precise macro estimates based on typical serving sizes.',
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Could not parse AI response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Forge Fit server running on port ${PORT}`);
  });
});
