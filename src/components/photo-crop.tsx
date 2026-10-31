'use client';

import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, X, ZoomIn } from 'lucide-react';

type Area = { x: number; y: number; width: number; height: number };

async function cropToFile(src: string, area: Area, name: string): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
  return new File([blob!], name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export default function PhotoCropper({
  onFile, label = 'Profile Picture', shape = 'round', initial,
}: {
  onFile: (file: File | null) => void;
  label?: string;
  shape?: 'round' | 'square';
  initial?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('photo.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [preview, setPreview] = useState<string | null>(initial ?? null);

  const onCropComplete = useCallback((_: unknown, croppedAreaPixels: Area) => setArea(croppedAreaPixels), []);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setSrc(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const confirm = async () => {
    if (!src || !area) return;
    const file = await cropToFile(src, area, fileName);
    onFile(file);
    setPreview(URL.createObjectURL(file));
    setSrc(null);
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[#F1F3F5] text-[#ADB5BD] ring-1 ring-black/10 transition hover:ring-[#E51A24] ${
            shape === 'round' ? 'rounded-full' : 'rounded-3xl'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <Camera size={22} />
          )}
          <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent pb-1.5 text-[10px] font-[650] text-white opacity-0 transition-opacity hover:opacity-100">
            Change
          </span>
        </button>
        <div className="text-xs leading-relaxed text-[#6C757D]">
          Upload from your device or gallery.
          <br />You can crop it before submitting.
          <button type="button" onClick={() => inputRef.current?.click()} className="mt-1.5 block font-[650] text-[#E51A24] hover:underline">
            Choose photo
          </button>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      <AnimatePresence>
        {src && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong w-full max-w-md overflow-hidden rounded-[28px]"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-[700]">Crop your photo</p>
                <button type="button" onClick={() => setSrc(null)} className="rounded-full p-1.5 hover:bg-black/5"><X size={16} /></button>
              </div>
              <div className="relative h-72 w-full bg-[#1A1A1A]">
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape={shape === 'round' ? 'round' : 'rect'}
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center gap-3 px-5 pt-4">
                <ZoomIn size={15} className="text-[#6C757D]" />
                <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#E51A24]" />
              </div>
              <div className="flex gap-2 p-5">
                <button type="button" onClick={() => setSrc(null)} className="btn btn-outline btn-md flex-1">Cancel</button>
                <button type="button" onClick={confirm} className="btn btn-primary btn-md flex-1 gap-1.5"><Check size={15} /> Use photo</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
