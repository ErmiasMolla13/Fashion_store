'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Truck, CheckCircle2, ShoppingBag } from 'lucide-react';
import useCart from '@/app/components/context/CartContext';
import useAuth from '@/app/components/context/AuthContext';

export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, isLoading, openAuth } = useAuth();
  const router = useRouter();

  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  // Pre-fill shipping name from the logged-in account.
  useEffect(() => {
    if (user) setShippingName((prev) => prev || user.name);
  }, [user]);

  // Customers must register/log in before they can buy.
  useEffect(() => {
    if (!isLoading && !user) {
      openAuth();
    }
  }, [isLoading, user, openAuth]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in to check out</h1>
        <p className="text-sm text-slate-500 mb-6">
          You need an account to place an order. Please sign in or create one to continue.
        </p>
        <button
          type="button"
          onClick={openAuth}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  if (placedOrderId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Order placed!</h1>
        <p className="text-sm text-slate-500 mb-1">
          Order <strong>#ORD-{placedOrderId}</strong> has been confirmed.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Pay in cash when it's delivered to your address.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-indigo-50 rounded-full mb-4">
          <ShoppingBag className="w-8 h-8 text-indigo-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h1>
        <p className="text-sm text-slate-500 mb-6">Add some items before checking out.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors cursor-pointer"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          shippingName,
          shippingPhone,
          shippingAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to place order');
      }

      setPlacedOrderId(data.order.id);
      clearCart();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 grid md:grid-cols-5 gap-8">
      {/* Shipping + Payment Form */}
      <form onSubmit={handlePlaceOrder} className="md:col-span-3 space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-1">Checkout</h1>
          <p className="text-xs text-slate-500">Enter your delivery details to place your order.</p>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Shipping Details</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address</label>
            <textarea
              required
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Street, city, landmark..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        <div className="space-y-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Payment Method</h2>
          <div className="flex items-start gap-3 p-3 border-2 border-indigo-600 bg-indigo-50 rounded-xl">
            <Truck className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-800">Cash on Delivery</p>
              <p className="text-[11px] text-slate-500">
                Pay in cash when your order arrives. No online payment needed.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Placing Order...' : `Place Order — ${getCartTotal().toLocaleString()} ETB`}
        </button>
      </form>

      {/* Order Summary */}
      <div className="md:col-span-2">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 sticky top-24">
          <h2 className="text-sm font-bold text-slate-800">Order Summary</h2>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {(item.price * item.quantity).toLocaleString()} ETB
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-lg font-black text-slate-900">
              {getCartTotal().toLocaleString()} <span className="text-xs text-slate-500 font-medium">ETB</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
