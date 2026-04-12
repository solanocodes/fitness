import { motion } from 'framer-motion';
import { HiOutlineFire, HiOutlineLightningBolt } from 'react-icons/hi';

interface Streak {
  icon: 'fire' | 'lightning';
  count: number;
  label: string;
}

interface Props {
  streaks: Streak[];
}

export default function StreakPills({ streaks }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1">
      {streaks.map((streak, i) => (
        <motion.div
          key={streak.label}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 min-w-fit"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.08 }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ borderColor: 'rgba(200,241,53,0.3)' }}
        >
          {streak.icon === 'fire' ? (
            <HiOutlineFire className="text-accent" size={28} />
          ) : (
            <HiOutlineLightningBolt className="text-accent" size={28} />
          )}
          <div>
            <span className="font-bebas text-text-primary" style={{ fontSize: '36px', lineHeight: 1 }}>
              {streak.count}
            </span>
            <div className="label-caps mt-0.5">{streak.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
