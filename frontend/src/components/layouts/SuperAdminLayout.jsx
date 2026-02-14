// frontend/src/components/layouts/SuperAdminLayout.jsx
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, CreditCard, FileText, Users, 
  BarChart3, LogOut, Menu, X, Bell, Shield, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import { getInitials } from '../../utils/helpers';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: 'Businesses', path: '/super-admin/businesses', icon: Building2 },
    { name: 'Subscriptions', path: '/super-admin/subscriptions', icon: CreditCard },
    { name: 'Requests', path: '/super-admin/requests', icon: FileText },
    { name: 'Admins', path: '/super-admin/admins', icon: Users },
    { name: 'Analytics', path: '/super-admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/super-admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-white/10 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" />
            <span className="font-bold text-lg text-white">Super Admin</span>
          </div>
        </div>
        
        <button className="p-2 text-white hover:bg-white/10 rounded-lg relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 h-full bg-gradient-to-b from-blue-600 to-indigo-700 border-r border-blue-500 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-blue-500">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white">Super Admin</span>
                  <p className="text-xs text-blue-200">Platform Control</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 font-semibold shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-blue-500">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 mb-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                {getInitials(user?.name || user?.email)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-sm text-blue-200 truncate">Super Admin</p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-2 w-full text-left text-white hover:bg-red-500/20 rounded-lg transition-colors ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <LogOut className="w-4 h-4" />
              {sidebarOpen && <span>Logout</span>}
            </button>

            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full p-2 mt-2 border border-blue-400 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5 mx-auto" />
            </button>
          </div>
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
              className="lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-blue-600 to-indigo-700 z-50 overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-white text-blue-600 font-semibold'
                          : 'text-white hover:bg-white/10'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-blue-500">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left text-white hover:bg-red-500/20 rounded-lg"
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
      <main className={`lg:ml-${sidebarOpen ? '64' : '20'} pt-16 lg:pt-0 transition-all duration-300`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;