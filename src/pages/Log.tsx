import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { HiOutlineScale, HiOutlineFire, HiOutlineBeaker } from 'react-icons/hi';

type LogType = 'weight' | 'meal' | 'water' | null;

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
  const [smm, setSmm] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await api.addBodyStat({
        weight: parseFloat(weight),
        bf_percent: bf ? parseFloat(bf) : null,
        muscle_mass: smm ? parseFloat(smm) : null,
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
        <label className="label-caps block mb-2">SKELETAL MUSCLE MASS (LBS)</label>
        <input
          type="number"
          step="0.1"
          value={smm}
          onChange={(e) => setSmm(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none"
          placeholder="82.5"
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

type MealTab = 'text' | 'manual' | 'photo';

function AnalysisResult({ analysis }: { analysis: any }) {
  return (
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
  );
}

function MealForm({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<MealTab>('text');

  // Shared state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSaveFav, setShowSaveFav] = useState(false);
  const [lastMeal, setLastMeal] = useState<any>(null);

  // Quick Text state
  const [textInput, setTextInput] = useState('');
  const [textAnalyzing, setTextAnalyzing] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<any>(null);

  // Manual Entry state
  const [manualName, setManualName] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCalories, setManualCalories] = useState('');

  // Photo state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);

  const tabs: { key: MealTab; label: string }[] = [
    { key: 'text', label: 'QUICK TEXT' },
    { key: 'manual', label: 'MANUAL' },
    { key: 'photo', label: 'PHOTO' },
  ];

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    setTextAnalyzing(true);
    try {
      const result = await api.analyzeMealText(textInput);
      setTextAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setTextAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const analyzePhoto = async () => {
    if (!file) return;
    setPhotoAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const result = await api.analyzeMeal(fd);
      setPhotoAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setPhotoAnalyzing(false);
    }
  };

  const saveMeal = async (mealData: { meal_name: string; protein: number; carbs: number; fat: number; calories: number; confidence: string; photo?: File }) => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (mealData.photo) fd.append('photo', mealData.photo);
      fd.append('meal_name', mealData.meal_name);
      fd.append('protein', String(mealData.protein));
      fd.append('carbs', String(mealData.carbs));
      fd.append('fat', String(mealData.fat));
      fd.append('calories', String(mealData.calories));
      fd.append('confidence', mealData.confidence);
      await api.addMeal(fd);
      setLastMeal(mealData);
      setSuccess(true);
      setShowSaveFav(true);
    } catch {
      setSaving(false);
    }
  };

  const submitText = () => {
    if (!textAnalysis) return;
    saveMeal({
      meal_name: textAnalysis.meal_name,
      protein: textAnalysis.protein_g,
      carbs: textAnalysis.carbs_g,
      fat: textAnalysis.fat_g,
      calories: textAnalysis.calories,
      confidence: textAnalysis.confidence,
    });
  };

  const submitManual = () => {
    if (!manualName || !manualCalories) return;
    saveMeal({
      meal_name: manualName,
      protein: parseFloat(manualProtein) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
      calories: parseInt(manualCalories) || 0,
      confidence: 'manual',
    });
  };

  const submitPhoto = () => {
    if (!photoAnalysis) return;
    saveMeal({
      meal_name: photoAnalysis.meal_name,
      protein: photoAnalysis.protein_g,
      carbs: photoAnalysis.carbs_g,
      fat: photoAnalysis.fat_g,
      calories: photoAnalysis.calories,
      confidence: photoAnalysis.confidence,
      photo: file || undefined,
    });
  };

  const saveAsFavorite = async () => {
    if (!lastMeal) return;
    try {
      await api.addSavedMeal({
        meal_name: lastMeal.meal_name,
        protein: lastMeal.protein,
        carbs: lastMeal.carbs,
        fat: lastMeal.fat,
        calories: lastMeal.calories,
      });
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  if (showSaveFav) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="font-bebas text-3xl text-accent">MEAL LOGGED!</h3>
        <p className="text-text-muted font-body text-sm">
          {lastMeal?.meal_name} — {lastMeal?.calories} cal
        </p>
        <div className="flex gap-3">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.97 }}
            className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
          >
            Done
          </motion.button>
          <motion.button
            onClick={saveAsFavorite}
            whileTap={{ scale: 0.97 }}
            className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold"
          >
            Save as Favorite
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <h3 className="font-bebas text-3xl text-text-primary">LOG MEAL</h3>

      {/* Tab switcher */}
      <div className="flex bg-surface rounded-lg p-1 gap-1">
        {tabs.map((t) => (
          <motion.button
            key={t.key}
            onClick={() => setTab(t.key)}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 py-2 rounded-md text-center transition-colors ${
              tab === t.key
                ? 'bg-accent text-bg font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
            style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '9px', fontWeight: 600, letterSpacing: '2px' }}
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === 'text' && (
          <motion.div key="text-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            <div>
              <label className="label-caps block mb-2">DESCRIBE YOUR MEAL</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-body text-sm focus:border-accent focus:outline-none resize-none"
                rows={3}
                placeholder="e.g. Grilled chicken breast with rice and steamed broccoli"
              />
            </div>
            {!textAnalysis && (
              <motion.button
                onClick={analyzeText}
                whileTap={{ scale: 0.97 }}
                disabled={textAnalyzing || !textInput.trim()}
                className="w-full bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
              >
                {textAnalyzing ? 'Estimating Macros...' : 'Estimate Macros'}
              </motion.button>
            )}
            {textAnalysis && <AnalysisResult analysis={textAnalysis} />}
            {textAnalysis && (
              <div className="flex gap-3">
                <motion.button onClick={onClose} whileTap={{ scale: 0.97 }} className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm">Cancel</motion.button>
                <motion.button onClick={submitText} whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Meal'}
                </motion.button>
              </div>
            )}
            {!textAnalysis && (
              <motion.button onClick={onClose} whileTap={{ scale: 0.97 }} className="w-full bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm">Cancel</motion.button>
            )}
          </motion.div>
        )}

        {tab === 'manual' && (
          <motion.div key="manual-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            <div>
              <label className="label-caps block mb-2">MEAL NAME</label>
              <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-body text-sm focus:border-accent focus:outline-none"
                placeholder="Chicken & Rice" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-caps block mb-2">PROTEIN (G)</label>
                <input type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none" placeholder="40" />
              </div>
              <div>
                <label className="label-caps block mb-2">CARBS (G)</label>
                <input type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none" placeholder="55" />
              </div>
              <div>
                <label className="label-caps block mb-2">FAT (G)</label>
                <input type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none" placeholder="12" />
              </div>
              <div>
                <label className="label-caps block mb-2">CALORIES</label>
                <input type="number" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-bebas text-2xl focus:border-accent focus:outline-none" placeholder="490" />
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button onClick={onClose} whileTap={{ scale: 0.97 }} className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm">Cancel</motion.button>
              <motion.button onClick={submitManual} whileTap={{ scale: 0.97 }} disabled={saving || !manualName || !manualCalories}
                className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Log Meal'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {tab === 'photo' && (
          <motion.div key="photo-tab" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
            {!preview ? (
              <label className="flex flex-col items-center justify-center w-full h-40 bg-surface border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/30 transition-colors">
                <HiOutlineFire size={32} className="text-text-muted mb-2" />
                <span className="label-caps">TAP TO UPLOAD PHOTO</span>
                <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <img src={preview} alt="Meal" className="w-full h-40 object-cover rounded-xl" />
                {!photoAnalysis && (
                  <motion.button onClick={analyzePhoto} whileTap={{ scale: 0.97 }} disabled={photoAnalyzing}
                    className="absolute bottom-3 right-3 bg-accent text-bg px-4 py-2 rounded-lg text-xs font-semibold">
                    {photoAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                  </motion.button>
                )}
              </div>
            )}
            {photoAnalysis && <AnalysisResult analysis={photoAnalysis} />}
            <div className="flex gap-3">
              <motion.button onClick={onClose} whileTap={{ scale: 0.97 }} className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm">Cancel</motion.button>
              <motion.button onClick={submitPhoto} whileTap={{ scale: 0.97 }} disabled={saving || !photoAnalysis}
                className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Log Meal'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
              <LogOption icon={HiOutlineBeaker} label="WATER" color="#06b6d4" onClick={() => setActive('water')} />
            </motion.div>
          ) : active === 'weight' ? (
            <WeightForm key="weight" onClose={() => setActive(null)} />
          ) : active === 'meal' ? (
            <MealForm key="meal" onClose={() => setActive(null)} />
          ) : (
            <WaterForm key="water" onClose={() => setActive(null)} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
