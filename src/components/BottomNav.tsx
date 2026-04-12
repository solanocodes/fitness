import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHome, HiPlus, HiCamera, HiPhotograph, HiChartBar } from 'react-icons/hi';

const tabs = [
  { path: '/', icon: HiHome, label: 'HOME' },
  { path: '/meals', icon: HiCamera, label: 'MEALS' },
  { path: '/log', icon: HiPlus, label: 'LOG' },
  { path: '/photos', icon: HiPhotograph, label: 'PHOTOS' },
  { path: '/stats', icon: HiChartBar, label: 'STATS' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          const isCenter = tab.path === '/log';

          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.92 }}
              className={`flex flex-col items-center justify-center relative ${
                isCenter ? 'w-14 h-14 -mt-6 rounded-2xl bg-accent' : 'w-16 h-full'
              }`}
            >
              <Icon
                className={`${isCenter ? 'text-bg' : ''}`}
                size={isCenter ? 28 : 22}
                color={active && !isCenter ? '#c8f135' : isCenter ? '#0a0a0a' : '#666666'}
              />
              {!isCenter && (
                <span
                  className="mt-0.5"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '8px',
                    fontWeight: 600,
                    letterSpacing: '2px',
                    color: active ? '#c8f135' : '#666666',
                  }}
                >
                  {tab.label}
                </span>
              )}
              {active && !isCenter && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
