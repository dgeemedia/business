// frontend/src/pages/Reviews.jsx
import React, { useState, useEffect } from 'react';
import { Star, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card, Badge, LoadingSpinner, EmptyState, Input } from '../components/shared';
import api from '../services/api';
import { formatDate, formatRelativeTime } from '../utils/helpers';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ratings');
      setReviews(response.data.ratings || []);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating);
    return matchesSearch && matchesRating;
  });

  // Calculate statistics
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? ((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(0)
      : 0
  }));

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
        <p className="text-gray-600">Customer feedback on your products</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Average Rating</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-500">Based on {reviews.length} reviews</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Reviews</p>
            <p className="text-4xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-sm text-gray-500">From verified customers</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">5-Star Reviews</p>
            <p className="text-4xl font-bold text-gray-900">
              {reviews.filter(r => r.rating === 5).length}
            </p>
            <p className="text-sm text-gray-500">
              {reviews.length > 0 
                ? `${((reviews.filter(r => r.rating === 5).length / reviews.length) * 100).toFixed(0)}%`
                : '0%'} of all reviews
            </p>
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card title="Rating Distribution">
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-20">
                <span className="font-medium text-gray-700">{rating}</span>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-16 text-right">
                {count} ({percentage}%)
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="input"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description={searchTerm ? "Try adjusting your search" : "Customer reviews will appear here"}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-lg flex-shrink-0">
                      {review.customerName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {review.customerName || 'Anonymous'}
                        </h3>
                        <Badge variant="info" size="sm">Verified</Badge>
                      </div>
                      <RatingStars rating={review.rating} />
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(review.createdAt)} • {review.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{review.productName}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt, 'short')}</p>
                  </div>
                </div>

                {review.review && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="text-gray-700 leading-relaxed">"{review.review}"</p>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;