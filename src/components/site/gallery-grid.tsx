'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Item = { id: number; imageUrl: string; caption: string | null };

export default function GalleryGrid({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);

  return (
    <>
      <div className="columns-2 gap-5 [column-fill:_balance] md:columns-3 lg:columns-4">
        {items.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: (i % 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setActive(g)}
            className="frame group mb-5 block w-full !p-2.5 text-left transition-transform duration-500 hover:-translate-y-1"
          >
            <span className="relative block overflow-hidden rounded-[12px]">
              <img
                src={g.imageUrl} alt={g.caption ?? 'Gallery'} loading="lazy"
                className={`w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] ${
                  i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/3]'
                }`}
              />
              {g.caption && (
                <span
                  className="absolute inset-x-2 bottom-2 rounded-[10px] border border-[#BEC0C6] px-3 py-2 text-left text-[11.5px] font-[650] text-[#333339] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ backgroundImage: 'linear-gradient(180deg,rgba(255, 255, 255,.96),rgba(229, 231, 237,.96))', boxShadow: '0 4px 10px rgba(31, 31, 37,.3)' }}
                >
                  {g.caption}
                </span>
              )}
            </span>
          </motion.button>
        ))}
      </div>
      {!items.length && <p className="py-20 text-center text-[#6C757D]">Photos coming soon.</p>}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#202026]/70 p-6 backdrop-blur-md"
            onClick={() => setActive(null)}
          >
            <motion.figure
              initial={{ scale: 0.94, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[85vh] max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="frame !p-3"><img src={active.imageUrl} alt={active.caption ?? ''} className="max-h-[74vh] w-auto rounded-[12px]" /></div>
              {active.caption && (
                <figcaption className="mt-3 text-center text-[13.5px] font-[650] text-[#EDEFEF]/90">{active.caption}</figcaption>
              )}
              <button onClick={() => setActive(null)} className="btn btn-outline absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center !p-0 text-[#333339]">
                <X size={17} />
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
