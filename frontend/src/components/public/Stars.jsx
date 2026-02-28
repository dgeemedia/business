// frontend/src/components/public/Stars.jsx
import React from 'react';
import { Star } from 'lucide-react';

export function Stars({ rating, dark }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : dark
              ? 'text-white/10 fill-white/10'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
    </span>
  );
}