import { motion } from 'framer-motion';
import {
  HiOutlineStar,
  HiOutlineFire,
  HiOutlineLightningBolt,
  HiOutlineScale,
  HiOutlineCamera,
  HiOutlineHeart,
  HiOutlineBeaker,
  HiOutlineTrendingDown,
} from 'react-icons/hi';

const BADGE_DEFS: Record<string, { icon: any; name: string; description: string }> = {
  first_weighin: { icon: HiOutlineScale, name: 'First Weigh-In', description: 'Logged your first weigh-in' },
  streak_7: { icon: HiOutlineFire, name: '7-Day Streak', description: '7 days in a row' },
  workouts_10: { icon: HiOutlineLightningBolt, name: 'Iron Decade', description: '10 workouts completed' },
  first_inbody: { icon: HiOutlineHeart, name: 'Body Scan', description: 'First InBody result' },
  lost_5lbs: { icon: HiOutlineTrendingDown, name: '5 Lbs Down', description: 'Lost 5 pounds' },
  first_meal: { icon: HiOutlineBeaker, name: 'Fuel Up', description: 'First meal logged' },
  workouts_5: { icon: HiOutlineStar, name: 'Getting Started', description: '5 workouts done' },
  hydrated: { icon: HiOutlineBeaker, name: 'Hydrated', description: '100oz in a day' },
  first_photo: { icon: HiOutlineCamera, name: 'Snapshot', description: 'First progress photo' },
};

const ALL_BADGES = Object.keys(BADGE_DEFS);

interface Props {
  earned: string[];
}

export default function AchievementsRow({ earned }: Props) {
  const earnedSet = new Set(earned);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 px-1" style={{ minWidth: 'max-content' }}>
        {ALL_BADGES.map((key, i) => {
          const badge = BADGE_DEFS[key];
          const isEarned = earnedSet.has(key);
          const Icon = badge.icon;

          return (
            <motion.div
              key={key}
              className={`flex flex-col items-center justify-center w-20 h-24 rounded-xl border ${
                isEarned
                  ? 'border-accent/50 bg-card'
                  : 'border-border bg-card/50 opacity-30 grayscale'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isEarned ? 1 : 0.3,
                scale: 1,
              }}
              transition={{
                delay: 0.6 + i * 0.05,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              whileHover={isEarned ? { scale: 1.05 } : {}}
              style={
                isEarned
                  ? { boxShadow: '0 0 15px rgba(200,241,53,0.15)' }
                  : {}
              }
            >
              <Icon size={24} className={isEarned ? 'text-accent' : 'text-text-muted'} />
              <span
                className="mt-1.5 text-center leading-tight"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '8px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: isEarned ? '#f0f0f0' : '#666666',
                }}
              >
                {badge.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
