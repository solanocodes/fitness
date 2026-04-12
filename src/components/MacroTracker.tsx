import { motion } from 'framer-motion';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  glowColor: string;
  delay: number;
}

function MacroBar({ label, current, target, color, glowColor, delay }: MacroBarProps) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="label-caps">{label}</span>
        <span className="font-bebas text-text-primary text-lg">
          {current}<span className="text-text-muted text-xs font-body">/{target}g</span>
        </span>
      </div>
      <div className="w-full h-[3px] bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 15, delay }}
        />
      </div>
    </div>
  );
}

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export default function MacroTracker({ protein, carbs, fat, calories }: Props) {
  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-5 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex justify-between items-baseline mb-4">
        <span className="label-caps-lg">TODAY'S MACROS</span>
        <div>
          <span className="font-bebas text-text-primary text-2xl">{calories}</span>
          <span className="text-text-muted text-xs font-body ml-1">/ 2400 cal</span>
        </div>
      </div>

      <div className="space-y-3">
        <MacroBar
          label="PROTEIN"
          current={protein}
          target={170}
          color="#c8f135"
          glowColor="rgba(200,241,53,0.4)"
          delay={0.5}
        />
        <MacroBar
          label="CARBS"
          current={carbs}
          target={250}
          color="#3b82f6"
          glowColor="rgba(59,130,246,0.4)"
          delay={0.6}
        />
        <MacroBar
          label="FAT"
          current={fat}
          target={80}
          color="#f59e0b"
          glowColor="rgba(245,158,11,0.4)"
          delay={0.7}
        />
      </div>
    </motion.div>
  );
}
