import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const schema = `
CREATE TABLE IF NOT EXISTS body_stats (
  id SERIAL PRIMARY KEY,
  weight NUMERIC(5,1),
  bf_percent NUMERIC(4,1),
  muscle_mass NUMERIC(5,1),
  visceral_fat NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  photo_url TEXT,
  meal_name TEXT,
  protein NUMERIC(5,1),
  carbs NUMERIC(5,1),
  fat NUMERIC(5,1),
  calories INTEGER,
  confidence TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  type TEXT,
  duration_mins INTEGER,
  calories_burned INTEGER,
  rounds INTEGER,
  intensity INTEGER,
  avg_heart_rate INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  source VARCHAR(20) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inbody_results (
  id SERIAL PRIMARY KEY,
  weight NUMERIC(5,1),
  bf_percent NUMERIC(4,1),
  muscle_mass NUMERIC(5,1),
  visceral_fat NUMERIC(4,1),
  bmi NUMERIC(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id SERIAL PRIMARY KEY,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_log (
  id SERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  water_oz INTEGER DEFAULT 0,
  bloat_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE,
  name TEXT,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forge_score_snapshots (
  id SERIAL PRIMARY KEY,
  score NUMERIC(5,1),
  bf_score NUMERIC(5,1),
  weight_score NUMERIC(5,1),
  consistency_score NUMERIC(5,1),
  workout_score NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function init() {
  try {
    await pool.query(schema);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  } finally {
    await pool.end();
  }
}

init();
