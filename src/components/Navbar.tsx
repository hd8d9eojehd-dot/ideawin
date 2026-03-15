import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Trophy, LayoutDashboard, LogIn, LogOut, Menu, X, Zap, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Competition', path: '/competition', icon: Shield },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Winners', path: '/winners', icon: Zap },
  ];

  if (user?.isAdmin || user?.is_admin) {
    navLinks.push({ name: 'Admin Portal', path: '/admin-portal', icon: LayoutDashboard });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-indigo-500/20">
      <div className="scan-line" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50">
                <Trophy className="text-white w-6 h-6" />
              </div>
            </motion.div>
            <span className="text-2xl font-black tracking-tight">
              <span className="gradient-text">IdeaWin by CAFYO</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              
              return (
                <Link key={link.name} to={link.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 rounded-lg"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="relative flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="ml-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all"
              >
                Register Here
              </motion.button>
            </Link>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-3 px-4 py-2 rounded-lg glass border border-indigo-500/30 hover:border-indigo-500/60 transition-all"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur-md opacity-50" />
                      <img 
                        src={user.picture} 
                        alt={user.fullName || user.full_name || 'User'} 
                        className="relative w-8 h-8 rounded-full border-2 border-indigo-500/50" 
                      />
                    </div>
                    <span className="text-sm font-bold text-white">
                      {user.fullName || user.full_name}
                    </span>
                  </motion.div>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2 rounded-lg glass border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </>
            ) : (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </motion.button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg glass border border-indigo-500/30 text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-b border-indigo-500/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
              
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg glass border border-indigo-500/30 text-white"
                    >
                      <img 
                        src={user.picture} 
                        alt={user.fullName || user.full_name || 'User'} 
                        className="w-8 h-8 rounded-full border-2 border-indigo-500/50" 
                      />
                      <span className="font-bold">{user.fullName || user.full_name}</span>
                    </motion.div>
                  </Link>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/30 text-red-400 font-bold"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </motion.button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
