// frontend/src/components/public/ProductImageSlideshow.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';

export function ProductImageSlideshow({ product, dark }) {
  const imageList = useMemo(() => {
    if (product.images && product.images.length > 0) {
      return product.images
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(img => img.imageUrl)
        .filter(Boolean);
    }
    if (product.imageUrl) return [product.imageUrl];
    return [];
  }, [product.images, product.imageUrl]);

  const [idx, setIdx] = useState(0);
  const [imgErrors, setImgErrors] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const autoAdvanceRef = useRef(null);

  useEffect(() => {
    setIdx(0);
    setImgErrors({});
  }, [product.id]);

  const stopAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();
    if (imageList.length > 1) {
      autoAdvanceRef.current = setInterval(() => {
        setIdx(i => (i + 1) % imageList.length);
      }, 3000);
    }
  };

  useEffect(() => {
    // Only auto-advance when not hovered
    if (!isHovered) {
      startAutoAdvance();
    } else {
      stopAutoAdvance();
    }
    return stopAutoAdvance;
  }, [isHovered, imageList.length]);

  const goToPrev = (e) => {
    e.stopPropagation();
    setIdx(i => (i - 1 + imageList.length) % imageList.length);
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setIdx(i => (i + 1) % imageList.length);
  };

  const goToIndex = (i, e) => {
    e.stopPropagation();
    setIdx(i);
  };

  // Show placeholder if no images or current image errored
  if (imageList.length === 0 || (imgErrors[idx] && imageList.filter((_, i) => !imgErrors[i]).length === 0)) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: dark
            ? 'rgba(255,255,255,.04)'
            : 'linear-gradient(135deg,#f3f0ea,#e8e4dc)',
        }}
      >
        <Package
          className="w-10 h-10"
          style={{ color: dark ? 'rgba(255,255,255,.15)' : '#ccc' }}
        />
      </div>
    );
  }

  // Find next non-errored index if current has error
  const displayIdx = imgErrors[idx]
    ? imageList.findIndex((_, i) => !imgErrors[i])
    : idx;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ✅ FIX: Images render at z-0, overlays sit on top at higher z levels */}
      <AnimatePresence mode="wait">
        <motion.img
          key={`${product.id}-${displayIdx}`}
          src={imageList[displayIdx]}
          alt={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onError={() => setImgErrors(prev => ({ ...prev, [displayIdx]: true }))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // ✅ FIX: z-index 0 so it's behind controls but visible
            // NO scale transform here — scale was fighting with AnimatePresence opacity
            zIndex: 0,
            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
      </AnimatePresence>

      {/* Nav arrows — z-20 so they sit above image */}
      {imageList.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-200 focus:outline-none"
            style={{
              zIndex: 20,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-200 focus:outline-none"
            style={{
              zIndex: 20,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators — z-20 */}
      {imageList.length > 1 && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
          style={{ zIndex: 20 }}
          onClick={e => e.stopPropagation()}
        >
          {imageList.map((_, i) => (
            <button
              key={i}
              onClick={e => goToIndex(i, e)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === displayIdx ? 14 : 5,
                height: 5,
                background: i === displayIdx ? 'white' : 'rgba(255,255,255,.5)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}