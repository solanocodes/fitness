import pool from './db.js';

export async function calculateForgeScore() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // BF% trend score (40% weight) - lower is better, reward downward trend
  let bfScore = 50;
  try {
    const bfRes = await pool.query(
      'SELECT bf_percent FROM body_stats WHERE bf_percent IS NOT NULL ORDER BY created_at DESC LIMIT 5'
    );
    if (bfRes.rows.length >= 2) {
      const latest = parseFloat(bfRes.rows[0].bf_percent);
      const oldest = parseFloat(bfRes.rows[bfRes.rows.length - 1].bf_percent);
      const diff = oldest - latest; // positive = improving
      bfScore = Math.min(100, Math.max(0, 50 + diff * 10));
    } else if (bfRes.rows.length === 1) {
      const bf = parseFloat(bfRes.rows[0].bf_percent);
      if (bf < 15) bfScore = 90;
      else if (bf < 20) bfScore = 70;
      else if (bf < 25) bfScore = 50;
      else bfScore = 30;
    }
  } catch (e) { /* use default */ }

  // Weight trend score (25% weight) - reward consistency toward goal
  let weightScore = 50;
  try {
    const wRes = await pool.query(
      'SELECT weight FROM body_stats WHERE weight IS NOT NULL ORDER BY created_at DESC LIMIT 5'
    );
    if (wRes.rows.length >= 2) {
      const latest = parseFloat(wRes.rows[0].weight);
      const oldest = parseFloat(wRes.rows[wRes.rows.length - 1].weight);
      const diff = oldest - latest;
      weightScore = Math.min(100, Math.max(0, 50 + diff * 5));
    }
  } catch (e) { /* use default */ }

  // Logging consistency score (20% weight) - days logged in last 7
  let consistencyScore = 0;
  try {
    const logRes = await pool.query(
      `SELECT COUNT(DISTINCT DATE(created_at)) as days FROM body_stats WHERE created_at >= $1`,
      [sevenDaysAgo]
    );
    const days = parseInt(logRes.rows[0].days) || 0;
    consistencyScore = Math.min(100, (days / 7) * 100);
  } catch (e) { /* use default */ }

  // Workout frequency score (15% weight) - workouts in last 7 days
  let workoutScore = 0;
  try {
    const workRes = await pool.query(
      'SELECT COUNT(*) as count FROM workouts WHERE created_at >= $1',
      [sevenDaysAgo]
    );
    const count = parseInt(workRes.rows[0].count) || 0;
    workoutScore = Math.min(100, (count / 5) * 100);
  } catch (e) { /* use default */ }

  const score = Math.round(
    bfScore * 0.4 + weightScore * 0.25 + consistencyScore * 0.2 + workoutScore * 0.15
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    bf_score: Math.round(bfScore),
    weight_score: Math.round(weightScore),
    consistency_score: Math.round(consistencyScore),
    workout_score: Math.round(workoutScore),
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
      condition: (r) => false, // checked separately
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

  // Check 5lbs lost separately
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
