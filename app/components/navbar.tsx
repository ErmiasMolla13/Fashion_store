"use client";

import { useState } from "react";
import { Menu, Search, ShoppingCart, User, LogOut } from "lucide-react";
import useCart from "./context/CartContext";
import useAuth from "./context/AuthContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user, openAuth, logout } = useAuth();

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-wider text-gray-900">
                FASHION
              </span>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="p-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* User / Auth Trigger Button */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className="p-2 text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
                    title={user.name}
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openAuth}
                  className="p-2 text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Sign in / Register"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-gray-700 hover:text-indigo-600 transition-colors relative cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="md:hidden p-2 text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-100 flex flex-col space-y-2 text-sm font-medium">
              <a href="/newArrival" className="text-gray-700 hover:text-indigo-600 py-1">New Arrivals</a>
              <a href="/menProduct" className="text-gray-700 hover:text-indigo-600 py-1">Men</a>
              <a href="/womenProduct" className="text-gray-700 hover:text-indigo-600 py-1">Women</a>
              <a href="/kidsProduct" className="text-gray-700 hover:text-indigo-600 py-1">Kids</a>
              <a href="/sale" className="text-indigo-600 font-bold py-1">Sale</a>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}