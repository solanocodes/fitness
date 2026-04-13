import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { HiOutlinePlus, HiX, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

export default function Photos() {
  const { data: photos, refetch } = useApi(() => api.getPhotos(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [comparing, setComparing] = useState<[any, any] | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);
  const [selected, setSelected] = useState<any[]>([]);
  const [managing, setManaging] = useState(false);

  const photosList = Array.isArray(photos) ? photos : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadDate(new Date().toISOString().split('T')[0]);
    setUploadNotes('');
    setShowUploadModal(true);
  };

  const submitUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', uploadFile);
      fd.append('date', new Date(uploadDate + 'T12:00:00').toISOString());
      if (uploadNotes) fd.append('notes', uploadNotes);
      await api.addPhoto(fd);
      refetch();
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePhoto(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelect = (photo: any) => {
    if (managing) return;
    if (selected.find((s) => s.id === photo.id)) {
      setSelected(selected.filter((s) => s.id !== photo.id));
    } else if (selected.length < 2) {
      const newSelected = [...selected, photo];
      if (newSelected.length === 2) {
        setComparing([newSelected[0], newSelected[1]]);
        setCompareIndex(0);
        setSelected([]);
      } else {
        setSelected(newSelected);
      }
    }
  };

  // For swipe-through comparison
  const swapComparePhoto = (side: 0 | 1, direction: 'prev' | 'next') => {
    if (!comparing) return;
    const currentId = comparing[side].id;
    const currentIdx = photosList.findIndex((p: any) => p.id === currentId);
    const nextIdx = direction === 'next'
      ? Math.min(currentIdx + 1, photosList.length - 1)
      : Math.max(currentIdx - 1, 0);
    const otherSide = side === 0 ? 1 : 0;
    if (photosList[nextIdx].id === comparing[otherSide].id) return;
    const newComparing: [any, any] = [...comparing] as [any, any];
    newComparing[side] = photosList[nextIdx];
    setComparing(newComparing);
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-8">
        <div className="flex justify-between items-baseline mb-1">
          <motion.h1
            className="font-bebas text-5xl text-text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            PROGRESS
          </motion.h1>
          {photosList.length > 0 && (
            <motion.button
              onClick={() => { setManaging(!managing); setSelected([]); }}
              whileTap={{ scale: 0.95 }}
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                managing
                  ? 'bg-red-500/20 border-red-500/30 text-red-400'
                  : 'bg-surface border-border text-text-muted'
              }`}
            >
              {managing ? 'DONE' : 'MANAGE'}
            </motion.button>
          )}
        </div>
        <motion.p
          className="text-text-muted font-body text-sm mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {managing
            ? 'Tap the trash icon to delete photos'
            : selected.length === 1
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
                year: '2-digit',
              });
              return (
                <motion.div
                  key={photo.id}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border-2 ${
                    isSelected ? 'border-accent' : 'border-transparent'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggleSelect(photo)}
                  whileTap={{ scale: managing ? 1 : 0.95 }}
                  layout
                >
                  <img
                    src={photo.photo_url}
                    alt={`Progress ${date}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-white text-xs font-body">{date}</span>
                  </div>
                  {isSelected && !managing && (
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
                  {managing && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this photo?')) handleDelete(photo.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center"
                    >
                      <HiOutlineTrash size={16} className="text-white" />
                    </motion.button>
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

      {/* Upload Modal with Date Picker */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 bg-bg/95 z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-between items-center p-4">
              <span className="label-caps-lg">UPLOAD PHOTO</span>
              <motion.button
                onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadPreview(null); }}
                whileTap={{ scale: 0.9 }}
                className="text-text-muted"
              >
                <HiX size={24} />
              </motion.button>
            </div>
            <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-20">
              {uploadPreview && (
                <img src={uploadPreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
              )}
              <div>
                <label className="label-caps block mb-2">DATE TAKEN</label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-body text-sm focus:border-accent focus:outline-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="label-caps block mb-2">NOTES (OPTIONAL)</label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-body text-sm focus:border-accent focus:outline-none"
                  placeholder="Front pose, morning weight..."
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => { setShowUploadModal(false); setUploadFile(null); setUploadPreview(null); }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 bg-surface border border-border rounded-lg py-3 text-text-muted font-body text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={submitUpload}
                  whileTap={{ scale: 0.97 }}
                  disabled={uploading || !uploadFile}
                  className="flex-1 bg-accent rounded-lg py-3 text-bg font-body text-sm font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal — upgraded */}
      <AnimatePresence>
        {comparing && (
          <motion.div
            className="fixed inset-0 bg-bg z-50 flex flex-col"
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

            <div className="flex-1 flex gap-1 px-2 pb-20 min-h-0">
              {comparing.map((photo, i) => {
                const date = new Date(photo.created_at);
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <motion.div
                    key={photo.id + '-' + i}
                    className="flex-1 flex flex-col min-h-0"
                    initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex-1 relative rounded-xl overflow-hidden min-h-0">
                      <img
                        src={photo.photo_url}
                        alt="Compare"
                        className="w-full h-full object-cover"
                      />
                      {/* Navigation arrows */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                        <motion.button
                          onClick={() => swapComparePhoto(i as 0 | 1, 'prev')}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <HiOutlineArrowLeft size={16} className="text-white" />
                        </motion.button>
                        <motion.button
                          onClick={() => swapComparePhoto(i as 0 | 1, 'next')}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <HiOutlineArrowRight size={16} className="text-white" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="font-bebas text-text-primary text-lg">{dateStr}</span>
                      {photo.notes && (
                        <span className="block text-text-muted text-xs font-body">{photo.notes}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating upload */}
      {!managing && (
        <motion.button
          onClick={() => fileRef.current?.click()}
          className="fixed bottom-20 right-4 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center z-40"
          whileTap={{ scale: 0.9 }}
          whileHover={{ boxShadow: '0 0 30px rgba(200,241,53,0.3)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
        >
          <HiOutlinePlus size={24} className="text-bg" />
        </motion.button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </PageTransition>
  );
}
