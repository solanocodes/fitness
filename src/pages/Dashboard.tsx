import { useMemo } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import ForgeScoreHero from '../components/ForgeScoreHero';
import StatCard from '../components/StatCard';
import MacroTracker from '../components/MacroTracker';
import StreakPills from '../components/StreakPills';
import AchievementsRow from '../components/AchievementsRow';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function Dashboard() {
  const { data: scoreData } = useApi(() => api.getForgeScore(), []);
  const { data: bodyStats } = useApi(() => api.getBodyStats(), []);
  const { data: meals } = useApi(() => api.getMeals(new Date().toISOString().split('T')[0]), []);
  const { data: achievements } = useApi(() => api.getAchievements(), []);
  const { data: dailyLog } = useApi(() => api.getDailyLog(), []);

  const score = scoreData || { score: 0, bf_score: 0, weight_score: 0, smm_score: 0, consistency_score: 0 };
  const latestWeight = parseFloat(bodyStats?.[0]?.weight) || 0;
  const latestBf = parseFloat(bodyStats?.[0]?.bf_percent) || 0;
  const latestSmm = parseFloat(bodyStats?.[0]?.muscle_mass) || 0;

  const todayMacros = useMemo(() => {
    if (!meals || !Array.isArray(meals)) return { protein: 0, carbs: 0, fat: 0, calories: 0 };
    return meals.reduce(
      (acc: any, m: any) => ({
        protein: acc.protein + (parseFloat(m.protein) || 0),
        carbs: acc.carbs + (parseFloat(m.carbs) || 0),
        fat: acc.fat + (parseFloat(m.fat) || 0),
        calories: acc.calories + (parseInt(m.calories) || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [meals]);

  const logStreak = useMemo(() => {
    if (!bodyStats || !Array.isArray(bodyStats)) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = bodyStats.some(
        (s: any) => new Date(s.created_at).toISOString().split('T')[0] === dateStr
      );
      if (hasEntry) streak++;
      else break;
    }
    return streak;
  }, [bodyStats]);

  const earnedKeys = useMemo(() => {
    if (!achievements || !Array.isArray(achievements)) return [];
    return achievements.map((a: any) => a.key);
  }, [achievements]);

  const waterOz = dailyLog?.water_oz || 0;

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="initial" animate="animate">
        <ForgeScoreHero
          score={score.score}
          bfScore={score.bf_score}
          weightScore={score.weight_score}
          smmScore={score.smm_score}
          consistencyScore={score.consistency_score}
        />

        <div className="px-4 space-y-5 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="WEIGHT" value={latestWeight} unit="lbs" delay={1} radius="8px" />
            <StatCard label="SMM" value={latestSmm} unit="lbs" delay={2} radius="16px" />
            <StatCard label="BODY FAT" value={latestBf} unit="%" delay={3} radius="8px" />
          </div>

          <motion.div
            className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <span className="label-caps">WATER TODAY</span>
            <div>
              <span className="font-bebas text-text-primary text-3xl">{waterOz}</span>
              <span className="text-text-muted text-xs font-body ml-1">oz</span>
            </div>
          </motion.div>

          <MacroTracker
            protein={Math.round(todayMacros.protein)}
            carbs={Math.round(todayMacros.carbs)}
            fat={Math.round(todayMacros.fat)}
            calories={todayMacros.calories}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="label-caps-lg mb-3 block">STREAKS</span>
            <StreakPills
              streaks={[
                { icon: 'fire', count: logStreak, label: 'DAY LOG STREAK' },
              ]}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="label-caps-lg mb-3 block">ACHIEVEMENTS</span>
            <AchievementsRow earned={earnedKeys} />
          </motion.div>

          <div className="h-4" />
        </div>
      </motion.div>
    </PageTransition>
  );
}
