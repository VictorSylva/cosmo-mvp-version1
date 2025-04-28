import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  ChartBarIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/20/solid';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/partner/dashboard', icon: HomeIcon },
    { name: 'Manage Products', href: '/partner/manage-products', icon: TagIcon },
    { name: 'Payment History', href: '/partner/payments', icon: CurrencyDollarIcon },
    { name: 'Analytics', href: '/partner/analytics', icon: ChartBarIcon },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/partner-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and brand section */}
        <Link to="/partner/dashboard" className="navbar-brand">
          CosmoCart Partner
        </Link>

        {/* Desktop navigation */}
        <div className="navbar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <item.icon />
              {item.name}
            </Link>
          ))}
        </div>

        {/* User profile section */}
        <div className="user-profile">
          <button onClick={handleLogout} className="logout-button">
            <ArrowRightOnRectangleIcon />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon />
            {item.name}
          </Link>
        ))}
        <button onClick={handleLogout} className="mobile-logout-button">
          <ArrowRightOnRectangleIcon />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 