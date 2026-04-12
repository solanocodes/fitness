import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { HiOutlinePlus, HiX } from 'react-icons/hi';

export default function Photos() {
  const { data: photos, refetch } = useApi(() => api.getPhotos(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState<[any, any] | null>(null);
  const [selected, setSelected] = useState<any[]>([]);

  const photosList = Array.isArray(photos) ? photos : [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await api.addPhoto(fd);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const toggleSelect = (photo: any) => {
    if (selected.find((s) => s.id === photo.id)) {
      setSelected(selected.filter((s) => s.id !== photo.id));
    } else if (selected.length < 2) {
      const newSelected = [...selected, photo];
      if (newSelected.length === 2) {
        setComparing([newSelected[0], newSelected[1]]);
        setSelected([]);
      } else {
        setSelected(newSelected);
      }
    }
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-8">
        <motion.h1
          className="font-bebas text-5xl text-text-primary mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          PROGRESS
        </motion.h1>
        <motion.p
          className="text-text-muted font-body text-sm mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {selected.length === 1
            ? 'Select one more photo to compare'
            : 'Tap two photos to compare side by side'}
        </motion.p>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {photosList.map((photo: any, i: number) => {
              const isSelected = selected.find((s) => s.id === photo.id);
              const date = new Date(photo.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              return (
                <motion.div
                  key={photo.id}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 ${
                    isSelected ? 'border-accent' : 'border-transparent'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleSelect(photo)}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Progress ${date}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-white text-xs font-body">{date}</span>
                  </div>
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 bg-accent/20 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-bg font-bebas text-lg">
                          {selected.indexOf(selected.find((s) => s.id === photo.id)!) + 1}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {photosList.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-text-muted font-body text-sm">No progress photos yet</span>
          </motion.div>
        )}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {comparing && (
          <motion.div
            className="fixed inset-0 bg-bg/95 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-between items-center p-4">
              <span className="label-caps-lg">COMPARE</span>
              <motion.button
                onClick={() => setComparing(null)}
                whileTap={{ scale: 0.9 }}
                className="text-text-muted"
              >
                <HiX size={24} />
              </motion.button>
            </div>
            <div className="flex-1 flex gap-2 px-4 pb-20">
              {comparing.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  className="flex-1 flex flex-col"
                  initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <img
                    src={photo.photo_url}
                    alt="Compare"
                    className="flex-1 object-cover rounded-xl"
                  />
                  <span className="text-center mt-2 font-body text-text-muted text-xs">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating upload */}
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
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </PageTransition>
  );
}
