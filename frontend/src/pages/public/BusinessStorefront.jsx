// frontend/src/pages/public/BusinessStorefront.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Phone, MapPin, Clock, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { getSubdomain } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

const BusinessStorefront = () => {
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // ---------- Redirect helper ----------
  const redirectToMainDomain = () => {
    if (import.meta.env.DEV) {
      // In development, VITE_SUBDOMAIN may be set to simulate a subdomain.
      // If we redirect because the business does not exist, we must exit the subdomain context.
      // The simplest approach: clear the override by reloading without the env var.
      // However, environment variables are static, so we recommend unsetting VITE_SUBDOMAIN
      // when testing non‑existent subdomains. Alternatively, you can remove the env var
      // from the terminal and restart the dev server.
      window.location.href = window.location.origin;
      return;
    }

    // Production: strip the subdomain from the hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      // e.g., business1.example.com → example.com
      const domain = parts.slice(-2).join('.');
      const port = window.location.port ? `:${window.location.port}` : '';
      window.location.href = `${window.location.protocol}//${domain}${port}`;
    } else {
      // Fallback: current origin (should already be main domain)
      window.location.href = window.location.origin;
    }
  };
  // -------------------------------------

  useEffect(() => {
    fetchBusinessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const subdomain = getSubdomain();

      // No subdomain → should never happen on this route, but redirect just in case
      if (!subdomain) {
        redirectToMainDomain();
        return;
      }

      // 1. Fetch business info
      const businessResponse = await api.get(`/api/business/public/${subdomain}`);
      if (!businessResponse.data.business) {
        // Business not found or inactive – redirect to main landing
        redirectToMainDomain();
        return;
      }
      setBusiness(businessResponse.data.business);

      // 2. Fetch products
      const productsResponse = await api.get(`/api/business/public/${subdomain}/products`);
      setProducts(productsResponse.data.products || []);
    } catch (error) {
      // Handle 404 specifically – business does not exist
      if (error.response?.status === 404) {
        redirectToMainDomain();
        return;
      }
      // For other errors, show a toast but stay on page (maybe a temporary issue)
      toast.error('Failed to load store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    toast.success('Added to cart');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = business?.taxRate ? (subtotal * business.taxRate / 100) : 0;
    const delivery = business?.deliveryFee || 0;
    return subtotal + tax + delivery;
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!business?.whatsappNumber) {
      toast.error('WhatsApp ordering not available');
      return;
    }

    const orderMessage = formatWhatsAppMessage();
    const cleanNumber = business.whatsappNumber.replace(/[^\d+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(orderMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    
    setCart([]);
    setOrderModalOpen(false);
    setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
    
    toast.success('Order sent to WhatsApp!');
  };

  const formatWhatsAppMessage = () => {
    const businessName = business?.name || 'Store';
    const currency = business?.currency || 'NGN';
    
    let message = `🛍️ *New Order from ${customerInfo.name}*\n\n`;
    message += `📱 *Customer Phone:* ${customerInfo.phone}\n`;
    message += `📍 *Delivery Address:* ${customerInfo.address}\n\n`;
    message += `*Order Details:*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Qty: ${item.quantity} × ${formatCurrency(item.price, currency)}\n`;
      message += `   Subtotal: ${formatCurrency(item.price * item.quantity, currency)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = business?.taxRate ? (subtotal * business.taxRate / 100) : 0;
    const delivery = business?.deliveryFee || 0;
    const total = subtotal + tax + delivery;
    
    message += `*Subtotal:* ${formatCurrency(subtotal, currency)}\n`;
    if (tax > 0) {
      message += `*Tax (${business.taxRate}%):* ${formatCurrency(tax, currency)}\n`;
    }
    if (delivery > 0) {
      message += `*Delivery Fee:* ${formatCurrency(delivery, currency)}\n`;
    }
    message += `*Total:* ${formatCurrency(total, currency)}\n\n`;
    
    if (customerInfo.notes) {
      message += `📝 *Special Notes:* ${customerInfo.notes}\n\n`;
    }
    
    message += `Thank you for ordering from *${businessName}*! 🙏`;
    
    return message;
  };

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  // ---------- Render logic ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // If business is null after loading, we have already attempted a redirect.
  // This fallback is only shown if the redirect did not happen (e.g., network error).
  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">This business does not exist.</p>
          <button
            onClick={redirectToMainDomain}
            className="mt-4 btn btn-primary"
          >
            Go to Main Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.description && (
                <p className="text-sm text-gray-600 mt-1">{business.description}</p>
              )}
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => cart.length > 0 && setOrderModalOpen(true)}
              className="relative btn btn-primary"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Business Info */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            {business.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{business.address}</span>
              </div>
            )}
            {business.businessHours && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{business.businessHours}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white border-b sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Products' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-medium transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.averageRating > 0 && (
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(product.price, business.currency || 'NGN')}
                    </span>
                    {product.stock > 0 && (
                      <span className="text-xs text-gray-500">
                        {product.stock} in stock
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.isAvailable || product.stock === 0}
                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!product.isAvailable ? 'Unavailable' : 
                     product.stock === 0 ? 'Out of Stock' : 
                     'Add to Cart'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Order Modal */}
      <AnimatePresence>
        {orderModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setOrderModalOpen(false)}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-hard"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
                  <button
                    onClick={() => setOrderModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900">Order Items:</h3>
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price, business.currency || 'NGN')} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(
                          cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                          business.currency || 'NGN'
                        )}</span>
                      </div>
                      {business?.taxRate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax ({business.taxRate}%):</span>
                          <span>{formatCurrency(
                            cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * business.taxRate / 100,
                            business.currency || 'NGN'
                          )}</span>
                        </div>
                      )}
                      {business?.deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Delivery Fee:</span>
                          <span>{formatCurrency(business.deliveryFee, business.currency || 'NGN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-primary-600">
                          {formatCurrency(calculateTotal(), business.currency || 'NGN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information Form */}
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Your Information:</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="input"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="input"
                        placeholder="+234 800 000 0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className="input"
                        rows="2"
                        placeholder="Enter your delivery address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Notes (Optional)
                      </label>
                      <textarea
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                        className="input"
                        rows="2"
                        placeholder="Any special instructions..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-full text-lg py-3"
                    >
                      <Send className="w-5 h-5" />
                      <span>Send Order via WhatsApp</span>
                    </button>

                    <p className="text-xs text-center text-gray-500">
                      You'll be redirected to WhatsApp to complete your order
                    </p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessStorefront;