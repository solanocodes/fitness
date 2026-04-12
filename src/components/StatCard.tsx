import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Props {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  delay?: number;
  radius?: string;
}

function AnimatedNumber({ value, decimals = 1, delay = 0 }: { value: number; decimals?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => v.toFixed(decimals));

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(motionValue, value, {
        duration: 1.2,
        ease: 'easeOut',
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

export default function StatCard({ label, value, unit, decimals = 1, delay = 0, radius = '8px' }: Props) {
  return (
    <motion.div
      className="bg-card border border-border p-4 hover:border-accent/30 transition-colors"
      style={{ borderRadius: radius }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4 }}
      whileHover={{ boxShadow: '0 0 20px rgba(200,241,53,0.08)' }}
      whileTap={{ scale: 0.97 }}
    >
      <span className="label-caps">{label}</span>
      <div className="mt-1">
        <span className="font-bebas text-text-primary" style={{ fontSize: '48px', lineHeight: 1 }}>
          <AnimatedNumber value={value} decimals={decimals} delay={delay * 0.08 + 0.2} />
        </span>
        <span className="text-text-muted text-xs ml-1 font-body">{unit}</span>
      </div>
    </motion.div>
  );
}
