'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { getCurrentUser, logout } from '../lib/auth';
import { User as UserType } from '../lib/types';
import { toast } from 'sonner';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Check for logged in user on mount and when storage changes
    const checkUser = () => setUser(getCurrentUser());
    checkUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zarathrift_current_user') checkUser();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/'; // simple refresh
  };

  return (
    <nav className="sticky top-0 z-50 navbar-dark border-b border-[#222222]">
      <div className="zara-container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="font-semibold text-2xl tracking-[-1.5px] text-white">ZARA THRIFT</div>
          <div className="text-[10px] font-mono text-[#888] mt-1">NG</div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#ccc]">
          <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
          <Link href="/shop?gender=Women" className="hover:text-white transition-colors">Women</Link>
          <Link href="/shop?gender=Men" className="hover:text-white transition-colors">Men</Link>
          <Link href="/track" className="hover:text-white transition-colors">Track Order</Link>
        </div>

        <div className="flex items-center gap-4 text-[#ccc]">
          <Link 
            href="/cart" 
            className="flex items-center gap-1.5 relative hover:text-white transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#f5f5f5] text-[#0a0a0a] text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="hidden sm:inline text-sm">Cart</span>
          </Link>

          {/* Auth Links */}
          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/account" className="flex items-center gap-1 hover:text-white">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.firstName}</span>
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1 hover:text-white text-xs"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/login" className="hover:text-white">Login</Link>
              <Link href="/register" className="hover:text-white">Register</Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[#222222] bg-[#0a0a0a] px-6 py-4 text-sm text-[#ccc]">
          <div className="flex flex-col gap-3">
            <Link href="/shop" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>Shop All</Link>
            <Link href="/shop?gender=Women" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>For Women</Link>
            <Link href="/shop?gender=Men" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>For Men</Link>
            <Link href="/track" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>Track Order</Link>
            <Link href="/cart" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>Cart ({cartCount})</Link>
            
            {user ? (
              <>
                <Link href="/account" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>My Account ({user.firstName})</Link>
                <button onClick={handleLogout} className="py-1 text-left hover:text-white">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>Login</Link>
                <Link href="/register" className="py-1 hover:text-white" onClick={() => setIsOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
