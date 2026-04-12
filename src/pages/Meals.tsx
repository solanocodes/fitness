import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { HiOutlinePlus } from 'react-icons/hi';

function MacroSummaryBar({ meals }: { meals: any[] }) {
  const totals = useMemo(() => {
    return meals.reduce(
      (acc, m) => ({
        protein: acc.protein + (parseFloat(m.protein) || 0),
        carbs: acc.carbs + (parseFloat(m.carbs) || 0),
        fat: acc.fat + (parseFloat(m.fat) || 0),
        calories: acc.calories + (parseInt(m.calories) || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [meals]);

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-baseline mb-3">
        <span className="label-caps-lg">TODAY'S TOTAL</span>
        <span className="font-bebas text-2xl text-text-primary">{totals.calories} cal</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="font-bebas text-xl text-accent">{Math.round(totals.protein)}g</div>
          <div className="label-caps">PROTEIN</div>
        </div>
        <div className="text-center">
          <div className="font-bebas text-xl text-blue-400">{Math.round(totals.carbs)}g</div>
          <div className="label-caps">CARBS</div>
        </div>
        <div className="text-center">
          <div className="font-bebas text-xl text-amber-400">{Math.round(totals.fat)}g</div>
          <div className="label-caps">FAT</div>
        </div>
      </div>
    </motion.div>
  );
}

function MealCard({ meal, index }: { meal: any; index: number }) {
  const time = new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      className="bg-card border border-border rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex">
        {meal.photo_url && (
          <img src={meal.photo_url} alt={meal.meal_name} className="w-20 h-20 object-cover" />
        )}
        <div className="flex-1 p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bebas text-lg text-text-primary">{meal.meal_name || 'Meal'}</h3>
              <span className="text-text-muted text-xs font-body">{time}</span>
            </div>
            {meal.confidence && (
              <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                meal.confidence === 'high' ? 'bg-accent/20 text-accent' :
                meal.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {meal.confidence}
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <span className="text-xs font-body text-accent">{Math.round(parseFloat(meal.protein) || 0)}g P</span>
            <span className="text-xs font-body text-blue-400">{Math.round(parseFloat(meal.carbs) || 0)}g C</span>
            <span className="text-xs font-body text-amber-400">{Math.round(parseFloat(meal.fat) || 0)}g F</span>
            <span className="text-xs font-body text-text-muted">{meal.calories} cal</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SavedMealCard({ meal, onQuickLog }: { meal: any; onQuickLog: (meal: any) => void }) {
  return (
    <motion.button
      onClick={() => onQuickLog(meal)}
      className="flex-shrink-0 bg-card border border-border rounded-xl px-4 py-3 min-w-[140px] text-left hover:border-accent/30 transition-colors"
      whileTap={{ scale: 0.95 }}
      whileHover={{ boxShadow: '0 0 15px rgba(200,241,53,0.08)' }}
    >
      <div className="font-bebas text-base text-text-primary leading-tight">{meal.meal_name}</div>
      <div className="flex gap-2 mt-1.5">
        <span className="text-accent" style={{ fontSize: '10px', fontFamily: '"DM Sans"', fontWeight: 600 }}>{Math.round(parseFloat(meal.protein))}P</span>
        <span className="text-blue-400" style={{ fontSize: '10px', fontFamily: '"DM Sans"', fontWeight: 600 }}>{Math.round(parseFloat(meal.carbs))}C</span>
        <span className="text-amber-400" style={{ fontSize: '10px', fontFamily: '"DM Sans"', fontWeight: 600 }}>{Math.round(parseFloat(meal.fat))}F</span>
      </div>
      <div className="font-bebas text-sm text-text-muted mt-0.5">{meal.calories} cal</div>
    </motion.button>
  );
}

export default function Meals() {
  const today = new Date().toISOString().split('T')[0];
  const { data: meals, refetch } = useApi(() => api.getMeals(today), []);
  const { data: savedMeals } = useApi(() => api.getSavedMeals(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const savedList = Array.isArray(savedMeals) ? savedMeals : [];

  const quickLogSaved = async (meal: any) => {
    try {
      const fd = new FormData();
      fd.append('meal_name', meal.meal_name);
      fd.append('protein', String(meal.protein));
      fd.append('carbs', String(meal.carbs));
      fd.append('fat', String(meal.fat));
      fd.append('calories', String(meal.calories));
      fd.append('confidence', 'saved');
      await api.addMeal(fd);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const analyzeForm = new FormData();
      analyzeForm.append('photo', file);
      let analysis: any = {};
      try {
        analysis = await api.analyzeMeal(analyzeForm);
      } catch {
        // AI analysis failed, save without macros
      }

      const fd = new FormData();
      fd.append('photo', file);
      fd.append('meal_name', analysis.meal_name || 'Meal');
      fd.append('protein', String(analysis.protein_g || 0));
      fd.append('carbs', String(analysis.carbs_g || 0));
      fd.append('fat', String(analysis.fat_g || 0));
      fd.append('calories', String(analysis.calories || 0));
      fd.append('confidence', analysis.confidence || 'low');
      await api.addMeal(fd);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const mealsList = Array.isArray(meals) ? meals : [];

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-8">
        <motion.h1
          className="font-bebas text-5xl text-text-primary mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          MEALS
        </motion.h1>
        <motion.p
          className="text-text-muted font-body text-sm mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Today's nutrition breakdown
        </motion.p>

        {/* Saved Meals quick-tap row */}
        {savedList.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4"
          >
            <span className="label-caps block mb-2">FAVORITES — TAP TO LOG</span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {savedList.map((m: any) => (
                <SavedMealCard key={m.id} meal={m} onQuickLog={quickLogSaved} />
              ))}
            </div>
          </motion.div>
        )}

        {mealsList.length > 0 && <MacroSummaryBar meals={mealsList} />}

        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {mealsList.map((meal: any, i: number) => (
              <MealCard key={meal.id} meal={meal} index={i} />
            ))}
          </AnimatePresence>

          {mealsList.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-text-muted font-body text-sm">No meals logged today</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating upload button */}
      <motion.button
        onClick={() => fileRef.current?.click()}
        className="fixed bottom-20 right-4 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center z-40"
        whileTap={{ scale: 0.9 }}
        whileHover={{ boxShadow: '0 0 30px rgba(200,241,53,0.3)' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.3 }}
      >
        {uploading ? (
          <motion.div
            className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        ) : (
          <HiOutlinePlus size={24} className="text-bg" />
        )}
      </motion.button>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
    </PageTransition>
  );
}
