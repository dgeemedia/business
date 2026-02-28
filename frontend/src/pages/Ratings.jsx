// frontend/src/pages/Ratings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, MessageSquare, Package, Search,
  ChevronDown, ChevronUp, TrendingUp, Award, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, LoadingSpinner, EmptyState, Input, Badge } from '../components/shared';
import { formatRelativeTime } from '../utils/helpers';
import ratingService from '../services/ratingService';

// ── Read-only star row ────────────────────────────────────────────────────────
function StarRow({ rating, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          style={{
            width: size, height: size,
            fill:  s <= Math.round(rating) ? '#FBBF24' : 'transparent',
            color: s <= Math.round(rating) ? '#FBBF24' : '#D1D5DB',
          }}
        />
      ))}
    </span>
  );
}

// ── Horizontal bar for star distribution ─────────────────────────────────────
function DistBar({ star, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-2 text-right text-gray-500 font-medium">{star}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-amber-400"
        />
      </div>
      <span className="w-4 text-right text-gray-400">{count}</span>
    </div>
  );
}

const STAR_LEVELS = [5, 4, 3, 2, 1];

const SENTIMENT = rating =>
  rating >= 4.5 ? { label: 'Excellent',  variant: 'success' }
  : rating >= 3.5 ? { label: 'Good',       variant: 'success' }
  : rating >= 2.5 ? { label: 'Average',    variant: 'warning' }
  : rating >= 1.5 ? { label: 'Poor',       variant: 'danger'  }
  :                 { label: 'Very Poor',   variant: 'danger'  };

// ── Single product card with expandable reviews ───────────────────────────────
function ProductReviewCard({ productName, ratings, index }) {
  const [expanded, setExpanded] = useState(false);

  const total      = ratings.length;
  const avg        = total > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / total : 0;
  const rounded    = Math.round(avg * 10) / 10;
  const sentiment  = SENTIMENT(rounded);
  const withText   = ratings.filter(r => r.review?.trim());
  const noText     = total - withText.length;

  const starCounts = STAR_LEVELS.reduce((acc, s) => {
    acc[s] = ratings.filter(r => r.rating === s).length;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="overflow-hidden">
        {/* ── Product header ── */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{productName}</h3>
              <Badge variant={sentiment.variant} className="flex-shrink-0">{sentiment.label}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRow rating={rounded} />
              <span className="text-sm font-bold text-gray-800">{rounded.toFixed(1)}</span>
              <span className="text-xs text-gray-400">
                ({total} review{total !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </div>

        {/* ── Star distribution ── */}
        <div className="p-3 bg-gray-50 rounded-xl mb-4 space-y-1.5">
          {STAR_LEVELS.map(s => (
            <DistBar key={s} star={s} count={starCounts[s] || 0} total={total} />
          ))}
        </div>

        {/* ── Expand / collapse toggle ── */}
        {total > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors border-t border-gray-100 pt-3"
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              {withText.length > 0
                ? `${withText.length} written review${withText.length !== 1 ? 's' : ''}`
                : 'No written reviews'}
              {noText > 0 && (
                <span className="font-normal text-gray-400 text-xs">
                  · {noText} rating{noText !== 1 ? 's' : ''} only
                </span>
              )}
            </span>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </button>
        )}

        {/* ── Review list ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 mt-3">
                {ratings.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <StarRow rating={r.rating} size={12} />
                        <span className="text-xs font-mono text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                          {r.phoneNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
                    </div>

                    {r.review?.trim() ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{r.review}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No written comment</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const Ratings = () => {
  const [allRatings, setAllRatings] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('recent'); // 'recent' | 'highest' | 'lowest' | 'most'

  useEffect(() => {
    (async () => {
      try {
        const data = await ratingService.getBusinessRatings();
        setAllRatings(data.ratings || []);
      } catch (err) {
        console.error('Failed to load ratings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Group flat ratings by product ────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {};
    for (const r of allRatings) {
      const key = r.productName || `Product #${r.productId}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return map;
  }, [allRatings]);

  // ── Top-level summary stats ───────────────────────────────────────────────
  const totalReviews   = allRatings.length;
  const withComments   = allRatings.filter(r => r.review?.trim()).length;
  const overallAvg     = totalReviews > 0
    ? allRatings.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;
  const uniqueProducts = Object.keys(grouped).length;

  // ── Build product-level summary list for display ─────────────────────────
  const productList = useMemo(() => {
    return Object.entries(grouped).map(([name, ratings]) => {
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      return { name, ratings, avg };
    });
  }, [grouped]);

  // ── Filter + sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = productList.filter(p => {
      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStar = starFilter === 'all' || Math.round(p.avg) === Number(starFilter);
      return matchName && matchStar;
    });

    if (sortBy === 'highest') list = [...list].sort((a, b) => b.avg - a.avg);
    else if (sortBy === 'lowest') list = [...list].sort((a, b) => a.avg - b.avg);
    else if (sortBy === 'most') list = [...list].sort((a, b) => b.ratings.length - a.ratings.length);
    else list = [...list].sort((a, b) => {
      const la = Math.max(...a.ratings.map(r => new Date(r.createdAt)));
      const lb = Math.max(...b.ratings.map(r => new Date(r.createdAt)));
      return lb - la;
    });

    return list;
  }, [productList, searchTerm, starFilter, sortBy]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Ratings & Reviews</h1>
        <p className="text-gray-500 text-sm">Customer feedback across all your products</p>
      </div>

      {/* ── Summary stat cards ── */}
      {totalReviews > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Star,
              label: 'Overall Rating',
              value: overallAvg.toFixed(1),
              sub: `${totalReviews} review${totalReviews !== 1 ? 's' : ''}`,
              color: 'text-amber-500',
              bg: 'bg-amber-50',
            },
            {
              icon: Package,
              label: 'Products Rated',
              value: uniqueProducts,
              sub: 'with at least 1 review',
              color: 'text-blue-500',
              bg: 'bg-blue-50',
            },
            {
              icon: MessageSquare,
              label: 'Written Reviews',
              value: withComments,
              sub: `${totalReviews - withComments} ratings only`,
              color: 'text-purple-500',
              bg: 'bg-purple-50',
            },
            {
              icon: TrendingUp,
              label: 'Satisfaction',
              value: `${totalReviews > 0 ? Math.round((allRatings.filter(r => r.rating >= 4).length / totalReviews) * 100) : 0}%`,
              sub: '4-star+ ratings',
              color: 'text-green-500',
              bg: 'bg-green-50',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} opacity-40 rounded-full -mr-10 -mt-10`} />
                <div className="relative">
                  <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by product name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-3">
            <select
              className="input w-full sm:w-40"
              value={starFilter}
              onChange={e => setStarFilter(e.target.value)}
            >
              <option value="all">All Stars</option>
              {STAR_LEVELS.map(s => (
                <option key={s} value={s}>{s} ★</option>
              ))}
            </select>
            <select
              className="input w-full sm:w-44"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="most">Most Reviews</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description={
              searchTerm || starFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Customer reviews will appear here once submitted'
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((item, i) => (
            <ProductReviewCard
              key={item.name}
              productName={item.name}
              ratings={item.ratings}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Ratings;