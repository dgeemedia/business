// frontend/src/pages/public/MainLanding.jsx
import React, { useState, useEffect } from 'react';
import { Search, Store, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import publicService from '../../services/publicService';

const MainLanding = () => {
  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const data = await publicService.getAllBusinesses();
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Business,<br />
              <span className="gradient-text">Amplified Online</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using MyPadiBusiness to manage operations,
              accept orders, and grow their customer base.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none text-lg"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <Store className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <h3 className="text-3xl font-bold text-gray-900">{businesses.length}+</h3>
                <p className="text-gray-600">Active Businesses</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <TrendingUp className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <h3 className="text-3xl font-bold text-gray-900">50K+</h3>
                <p className="text-gray-600">Orders Processed</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-soft">
                <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <h3 className="text-3xl font-bold text-gray-900">10K+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Businesses Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Explore Our Businesses
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto" />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <p className="text-center text-gray-500">No businesses found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <motion.a
                  key={business.id}
                  href={`http://${business.subdomain}.${window.location.hostname.split('.').slice(-2).join('.')}`}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-soft hover:shadow-medium transition-all p-6 block"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {business.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {business.description || 'Quality products and services'}
                      </p>
                      <div className="flex items-center text-primary-600 text-sm font-medium">
                        Visit Store <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-orange-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join MyPadiBusiness today and start accepting orders online
          </p>
          <button className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors">
            Get Started Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default MainLanding;