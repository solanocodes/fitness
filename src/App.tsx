import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Log from './pages/Log';
import Meals from './pages/Meals';
import Photos from './pages/Photos';
import Stats from './pages/Stats';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<Log />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
