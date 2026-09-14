'use client';

import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Use path alias `@/` to avoid relative path import mismatches
import useCart from '@/app/components/context/CartContext';
import useAuth from '@/app/components/context/AuthContext';

export function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    getCartTotal,
  } = useCart();
  const { user, openAuth } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      // Customers must be registered/logged in before they can buy.
      openAuth();
      return;
    }
    router.push('/checkout');
  };

  // Return null when closed so it doesn't render DOM nodes needlessly
  if (!isCartOpen) return null;

  return (
    <div className="relative z-50">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Your Shopping Cart</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="p-4 bg-indigo-50 rounded-full mb-3">
                <ShoppingBag className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-[200px] mb-6">
                Explore our collections to add items to your cart.
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border border-slate-100 p-3 rounded-xl bg-white shadow-sm hover:border-indigo-100 transition-colors"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 text-xs truncate">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.category && (
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {item.category}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-slate-800 font-bold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="font-extrabold text-xs text-indigo-600">
                        {(item.price * item.quantity).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Subtotal
              </span>
              <span className="text-xl font-black text-slate-900">
                {getCartTotal().toLocaleString()} <span className="text-xs text-slate-500 font-medium">ETB</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 active:scale-[0.99]"
            >
              Proceed to Checkout
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-full border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-xs hover:bg-white transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}