import pool from './db.js';

// Your personal goals
const GOAL_WEIGHT = 180;       // lbs
const GOAL_BF_PERCENT = 12;    // %
const GOAL_SMM = 100;          // lbs skeletal muscle mass

export async function calculateForgeScore() {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Body Fat % score (30%) — how close to 12% goal
  // At goal = 100, each % away from goal = -8 points, floor at 0
  let bfScore = 0;
  try {
    const bfRes = await pool.query(
      'SELECT bf_percent FROM body_stats WHERE bf_percent IS NOT NULL ORDER BY created_at DESC LIMIT 1'
    );
    if (bfRes.rows.length > 0) {
      const bf = parseFloat(bfRes.rows[0].bf_percent);
      const distance = Math.abs(bf - GOAL_BF_PERCENT);
      bfScore = Math.max(0, Math.round(100 - distance * 8));
    }
  } catch (e) { /* use default */ }

  // Weight score (25%) — how close to 180 lbs goal
  // At goal = 100, each lb away = -3 points, floor at 0
  let weightScore = 0;
  try {
    const wRes = await pool.query(
      'SELECT weight FROM body_stats WHERE weight IS NOT NULL ORDER BY created_at DESC LIMIT 1'
    );
    if (wRes.rows.length > 0) {
      const w = parseFloat(wRes.rows[0].weight);
      const distance = Math.abs(w - GOAL_WEIGHT);
      weightScore = Math.max(0, Math.round(100 - distance * 3));
    }
  } catch (e) { /* use default */ }

  // Skeletal Muscle Mass score (25%) — how close to 100 lbs goal
  // At goal = 100, each lb away = -4 points, floor at 0
  let smmScore = 0;
  try {
    const sRes = await pool.query(
      'SELECT muscle_mass FROM body_stats WHERE muscle_mass IS NOT NULL ORDER BY created_at DESC LIMIT 1'
    );
    if (sRes.rows.length > 0) {
      const smm = parseFloat(sRes.rows[0].muscle_mass);
      const distance = Math.abs(smm - GOAL_SMM);
      smmScore = Math.max(0, Math.round(100 - distance * 4));
    }
  } catch (e) { /* use default */ }

  // Logging consistency score (20%) — days logged in last 7
  let consistencyScore = 0;
  try {
    const logRes = await pool.query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as days FROM body_stats WHERE created_at >= $1`,
      [sevenDaysAgo]
    );
    const days = parseInt(logRes.rows[0].days) || 0;
    consistencyScore = Math.min(100, Math.round((days / 7) * 100));
  } catch (e) { /* use default */ }

  const score = Math.round(
    bfScore * 0.30 + weightScore * 0.25 + smmScore * 0.25 + consistencyScore * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    bf_score: bfScore,
    weight_score: weightScore,
    smm_score: smmScore,
    consistency_score: consistencyScore,
  };
}

export async function checkAchievements() {
  const newAchievements = [];

  const checks = [
    {
      key: 'first_weighin',
      name: 'First Weigh-In',
      description: 'Logged your first weigh-in',
      query: 'SELECT COUNT(*) as c FROM body_stats',
      condition: (r) => parseInt(r.rows[0].c) >= 1,
    },
    {
      key: 'streak_7',
      name: '7-Day Streak',
      description: 'Logged weight 7 days in a row',
      query: `SELECT COUNT(DISTINCT DATE(created_at)) as c FROM body_stats WHERE created_at >= NOW() - INTERVAL '7 days'`,
      condition: (r) => parseInt(r.rows[0].c) >= 7,
    },
    {
      key: 'workouts_10',
      name: 'Iron Decade',
      description: 'Completed 10 workouts',
      query: 'SELECT COUNT(*) as c FROM workouts',
      condition: (r) => parseInt(r.rows[0].c) >= 10,
    },
    {
      key: 'first_inbody',
      name: 'Body Scan',
      description: 'Logged your first InBody result',
      query: 'SELECT COUNT(*) as c FROM inbody_results',
      condition: (r) => parseInt(r.rows[0].c) >= 1,
    },
    {
      key: 'lost_5lbs',
      name: '5 Lbs Down',
      description: 'Lost 5 pounds from your starting weight',
      query: 'SELECT weight FROM body_stats WHERE weight IS NOT NULL ORDER BY created_at ASC LIMIT 1',
      condition: (r) => false,
    },
    {
      key: 'first_meal',
      name: 'Fuel Up',
      description: 'Logged your first meal',
      query: 'SELECT COUNT(*) as c FROM meals',
      condition: (r) => parseInt(r.rows[0].c) >= 1,
    },
    {
      key: 'workouts_5',
      name: 'Getting Started',
      description: 'Completed 5 workouts',
      query: 'SELECT COUNT(*) as c FROM workouts',
      condition: (r) => parseInt(r.rows[0].c) >= 5,
    },
    {
      key: 'hydrated',
      name: 'Hydrated',
      description: 'Logged 100oz of water in a day',
      query: 'SELECT MAX(water_oz) as m FROM daily_log',
      condition: (r) => parseInt(r.rows[0]?.m || 0) >= 100,
    },
  ];

  try {
    const first = await pool.query('SELECT weight FROM body_stats WHERE weight IS NOT NULL ORDER BY created_at ASC LIMIT 1');
    const latest = await pool.query('SELECT weight FROM body_stats WHERE weight IS NOT NULL ORDER BY created_at DESC LIMIT 1');
    if (first.rows.length && latest.rows.length) {
      const diff = parseFloat(first.rows[0].weight) - parseFloat(latest.rows[0].weight);
      if (diff >= 5) {
        checks.find(c => c.key === 'lost_5lbs').condition = () => true;
      }
    }
  } catch (e) { /* skip */ }

  for (const check of checks) {
    try {
      const existing = await pool.query('SELECT id FROM achievements WHERE key = $1', [check.key]);
      if (existing.rows.length > 0) continue;

      const result = await pool.query(check.query);
      if (check.condition(result)) {
        await pool.query(
          'INSERT INTO achievements (key, name, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
          [check.key, check.name, check.description]
        );
        newAchievements.push({ key: check.key, name: check.name, description: check.description });
      }
    } catch (e) { /* skip */ }
  }

  return newAchievements;
}
