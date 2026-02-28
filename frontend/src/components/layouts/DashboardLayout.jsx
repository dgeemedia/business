// frontend/src/components/layouts/DashboardLayout.jsx
// ✅ CHANGED: Removed "Staff" nav item (merged into Users.jsx)
// ✅ ADDED:   "Subscription" nav item with expiry warning indicator

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  Star,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import useBusinessStore from '../../stores/businessStore';
import { getInitials, daysUntil } from '../../utils/helpers';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentBusiness, fetchCurrentBusiness } = useBusinessStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchCurrentBusiness();
  }, [fetchCurrentBusiness]);

  // Compute subscription urgency for badge
  const subExpiry = currentBusiness?.subscriptionExpiry || currentBusiness?.trialEndsAt;
  const subDays   = subExpiry ? daysUntil(subExpiry) : null;
  const subUrgent = subDays !== null && subDays <= 7;

  const navItems = [
    { name: 'Dashboard',     path: '/dashboard',              icon: LayoutDashboard },
    { name: 'Products',      path: '/dashboard/products',     icon: Package         },
    { name: 'Orders',        path: '/dashboard/orders',       icon: ShoppingCart    },
    { name: 'Users & Team',  path: '/dashboard/users',        icon: Users           },
    { name: 'Reviews',       path: '/dashboard/reviews',      icon: Star            },
    { name: 'Settings',      path: '/dashboard/settings',     icon: Settings        },
    {
      name: 'Subscription',
      path: '/dashboard/subscription',
      icon: CreditCard,
      badge: subUrgent ? (subDays <= 0 ? '!' : `${subDays}d`) : null,
      badgeVariant: subDays !== null && subDays <= 0 ? 'red' : 'orange',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ item, onClick }) => (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
          isActive
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        }`
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {sidebarOpen && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                item.badgeVariant === 'red'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-orange-100 text-orange-600'
              }`}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
      {/* Dot indicator when sidebar is collapsed */}
      {!sidebarOpen && item.badge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-lg truncate max-w-[160px]">
              {currentBusiness?.businessName || currentBusiness?.name || 'Dashboard'}
            </span>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5" />
          {subUrgent && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {sidebarOpen ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-base truncate">
                  {currentBusiness?.businessName || currentBusiness?.name || 'Dashboard'}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Subscription warning banner */}
          {sidebarOpen && subUrgent && (
            <div className={`mx-3 mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              subDays <= 0
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-orange-50 border border-orange-200 text-orange-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {subDays <= 0
                  ? 'Subscription expired!'
                  : `Expires in ${subDays} day${subDays !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                {getInitials(user?.name || user?.firstName || user?.email)}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </>
              )}
            </div>

            <AnimatePresence>
              {userMenuOpen && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 py-2"
                >
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 m-4 border border-gray-200 rounded-lg hover:bg-gray-50 hidden lg:block"
          >
            <Menu className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white z-50 overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeVariant === 'red'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;