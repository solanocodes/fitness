import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { HiOutlineScale, HiOutlineFire, HiOutlineLightningBolt, HiOutlineBeaker } from 'react-icons/hi';

type LogType = 'weight' | 'meal' | 'workout' | 'water' | null;

function LogOption({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-3 hover:border-accent/30 transition-colors"
      whileTap={{ scale: 0.97 }}
      whileHover={{ boxShadow: '0 0 20px rgba(200,241,53,0.08)' }}
    >
      <Icon size={32} style={{ color }} />
      <span className="label-caps-lg">{label}</span>
    </motion.button>
  );
}

function WeightForm({ onClose }: { onClose: () => void }) {
  const [weight, setWeight] = useState('');
  const [bf, setBf] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await api.addBodyStat({
        weight: parseFloat(weight),
        bf_percent: bf ? parseFloat(bf) : null,
      });
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <h3 className="font-bebas text-3xl text-text-primary">LOG WEIGHT</h3>
      <div>
        <label className="label-caps block mb-2">WEIGHT (LBS)</label>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
          placeholder="185.0"
        />
      </div>
      <div>
        <label className="label-caps block mb-2">BODY FAT %</label>
        <input
          type="number"
          step="0.1"
          value={bf}
          onChange={(e) => setBf(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
          placeholder="18.5"
        />
      </div>
      <div className="flex gap-3">
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={submit}
          whileTap={{ scale: 0.97 }}
          disabled={saving || !weight}
          className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
        >
          {success ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function WorkoutForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('boxing');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [rounds, setRounds] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const types = ['boxing', 'weights', 'cardio', 'hiit', 'yoga', 'running', 'cycling', 'swimming', 'other'];

  const submit = async () => {
    if (!duration) return;
    setSaving(true);
    try {
      await api.addWorkout({
        type,
        duration_mins: parseInt(duration),
        calories_burned: calories ? parseInt(calories) : null,
        rounds: rounds ? parseInt(rounds) : null,
        intensity,
      });
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <h3 className="font-bebas text-3xl text-text-primary">LOG WORKOUT</h3>
      <div>
        <label className="label-caps block mb-2">TYPE</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <motion.button
              key={t}
              onClick={() => setType(t)}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-body uppercase tracking-wider ${
                type === t
                  ? 'bg-accent text-bg border-accent font-semibold'
                  : 'bg-surface border-border text-text-muted'
              }`}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-caps block mb-2">DURATION (MIN)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
            placeholder="45"
          />
        </div>
        <div>
          <label className="label-caps block mb-2">CALORIES</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
            placeholder="350"
          />
        </div>
      </div>
      {type === 'boxing' && (
        <div>
          <label className="label-caps block mb-2">ROUNDS</label>
          <input
            type="number"
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
            placeholder="12"
          />
        </div>
      )}
      <div>
        <label className="label-caps block mb-2">INTENSITY ({intensity}/10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={intensity}
          onChange={(e) => setIntensity(parseInt(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-text-muted text-xs font-body mt-1">
          <span>Easy</span>
          <span>Maximum</span>
        </div>
      </div>
      <div className="flex gap-3">
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={submit}
          whileTap={{ scale: 0.97 }}
          disabled={saving || !duration}
          className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
        >
          {success ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function MealForm({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const result = await api.analyzeMeal(fd);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (file) fd.append('photo', file);
      fd.append('meal_name', analysis?.meal_name || 'Meal');
      fd.append('protein', String(analysis?.protein_g || 0));
      fd.append('carbs', String(analysis?.carbs_g || 0));
      fd.append('fat', String(analysis?.fat_g || 0));
      fd.append('calories', String(analysis?.calories || 0));
      fd.append('confidence', analysis?.confidence || 'medium');
      fd.append('notes', notes);
      await api.addMeal(fd);
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <h3 className="font-bebas text-3xl text-text-primary">LOG MEAL</h3>

      {!preview ? (
        <label className="flex flex-col items-center justify-center w-full h-40 bg-surface border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/30 transition-colors">
          <HiOutlineFire size={32} className="text-text-muted mb-2" />
          <span className="label-caps">TAP TO UPLOAD PHOTO</span>
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        </label>
      ) : (
        <div className="relative">
          <img src={preview} alt="Meal" className="w-full h-40 object-cover rounded-xl" />
          {!analysis && (
            <motion.button
              onClick={analyze}
              whileTap={{ scale: 0.97 }}
              disabled={analyzing}
              className="absolute bottom-3 right-3 bg-accent text-bg px-4 py-2 rounded-lg text-xs font-semibold"
            >
              {analyzing ? 'Analyzing...' : 'AI Analyze'}
            </motion.button>
          )}
        </div>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-accent/20 rounded-xl p-4 space-y-2"
        >
          <div className="flex justify-between items-baseline">
            <span className="font-bebas text-xl text-text-primary">{analysis.meal_name}</span>
            <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
              analysis.confidence === 'high' ? 'bg-accent/20 text-accent' :
              analysis.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {analysis.confidence}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="font-bebas text-lg text-accent">{analysis.protein_g}g</div>
              <div className="label-caps">PROTEIN</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-lg text-blue-400">{analysis.carbs_g}g</div>
              <div className="label-caps">CARBS</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-lg text-amber-400">{analysis.fat_g}g</div>
              <div className="label-caps">FAT</div>
            </div>
            <div className="text-center">
              <div className="font-bebas text-lg text-text-primary">{analysis.calories}</div>
              <div className="label-caps">CAL</div>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <label className="label-caps block mb-2">NOTES</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-body text-sm focus:border-accent focus:outline-none"
          placeholder="Post-workout meal..."
        />
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={submit}
          whileTap={{ scale: 0.97 }}
          disabled={saving || (!analysis && !file)}
          className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
        >
          {success ? 'Saved!' : saving ? 'Saving...' : 'Save Meal'}
        </motion.button>
      </div>
    </motion.div>
  );
}

function WaterForm({ onClose }: { onClose: () => void }) {
  const [oz, setOz] = useState('');
  const [bloat, setBloat] = useState(5);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const quickAdd = [8, 16, 24, 32];

  const submit = async () => {
    if (!oz) return;
    setSaving(true);
    try {
      await api.addDailyLog({ water_oz: parseInt(oz), bloat_score: bloat });
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <h3 className="font-bebas text-3xl text-text-primary">LOG WATER</h3>
      <div>
        <label className="label-caps block mb-2">AMOUNT (OZ)</label>
        <input
          type="number"
          value={oz}
          onChange={(e) => setOz(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
          placeholder="16"
        />
        <div className="flex gap-2 mt-2">
          {quickAdd.map((amt) => (
            <motion.button
              key={amt}
              onClick={() => setOz(String(amt))}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-surface border border-border rounded-lg py-2 text-text-muted font-bebas text-lg hover:border-accent/30"
            >
              {amt}oz
            </motion.button>
          ))}
        </div>
      </div>
      <div>
        <label className="label-caps block mb-2">HOW DO YOU FEEL? ({bloat}/10)</label>
        <input
          type="range"
          min="1"
          max="10"
          value={bloat}
          onChange={(e) => setBloat(parseInt(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-text-muted text-xs font-body mt-1">
          <span>Bloated</span>
          <span>Great</span>
        </div>
      </div>
      <div className="flex gap-3">
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={submit}
          whileTap={{ scale: 0.97 }}
          disabled={saving || !oz}
          className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
        >
          {success ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function Log() {
  const [active, setActive] = useState<LogType>(null);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-8">
        <motion.h1
          className="font-bebas text-5xl text-text-primary mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          QUICK LOG
        </motion.h1>
        <motion.p
          className="text-text-muted font-body text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          What are we tracking today?
        </motion.p>

        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="options"
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ staggerChildren: 0.08 }}
            >
              <LogOption icon={HiOutlineScale} label="WEIGHT" color="#c8f135" onClick={() => setActive('weight')} />
              <LogOption icon={HiOutlineFire} label="MEAL" color="#f59e0b" onClick={() => setActive('meal')} />
              <LogOption icon={HiOutlineLightningBolt} label="WORKOUT" color="#3b82f6" onClick={() => setActive('workout')} />
              <LogOption icon={HiOutlineBeaker} label="WATER" color="#06b6d4" onClick={() => setActive('water')} />
            </motion.div>
          ) : active === 'weight' ? (
            <WeightForm key="weight" onClose={() => setActive(null)} />
          ) : active === 'meal' ? (
            <MealForm key="meal" onClose={() => setActive(null)} />
          ) : active === 'workout' ? (
            <WorkoutForm key="workout" onClose={() => setActive(null)} />
          ) : (
            <WaterForm key="water" onClose={() => setActive(null)} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
