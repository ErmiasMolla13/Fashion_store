'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  TrendingUp,
  DollarSign,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import useAuth from '../components/context/AuthContext';

interface Product {
  id: number;
  name: string;
  category: 'men' | 'women' | 'kids' | 'accessories';
  price: number;
  stock: number;
  image: string;
  badge: 'New' | 'Sale' | 'None';
}

interface Order {
  id: string;
  numericId: number;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  joined: string;
}

const emptyForm = {
  name: '',
  category: 'men' as Product['category'],
  price: '',
  stock: '',
  image: '',
  badge: 'None' as Product['badge'],
};

const statusStyles: Record<Order['status'], string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

type Tab = 'dashboard' | 'products' | 'orders' | 'customers';

export default function AdminPage() {
  const { user, isLoading: authLoading, openAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, o, c] = await Promise.all([
        fetch('/api/products').then(r => {
          if (!r.ok) throw new Error('Failed to load products');
          return r.json();
        }),
        fetch('/api/orders').then(r => {
          if (!r.ok) throw new Error('Failed to load orders');
          return r.json();
        }),
        fetch('/api/customers').then(r => {
          if (!r.ok) throw new Error('Failed to load customers');
          return r.json();
        }),
      ]);
      setProducts(p);
      setOrders(o);
      setCustomers(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      loadData();
    }
  }, [user, loadData]);

  const handleOrderStatusChange = async (numericId: number, status: Order['status']) => {
    // Optimistic update so the dropdown feels instant.
    setOrders(prev => prev.map(o => (o.numericId === numericId ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/orders/${numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
    } catch {
      // Revert on failure by reloading from the server.
      loadData();
    }
  };

  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + o.total : sum), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      badge: product.badge,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stock) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        image:
          form.image ||
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
        badge: form.badge,
      };

      if (editingId !== null) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update product');
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create product');
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" /> },
  ];

  // Gate the entire admin dashboard behind an authenticated admin session.
  // The underlying API routes enforce this too, so this is UX, not the
  // actual security boundary — but it keeps non-admins from seeing the UI.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Admin sign-in required</h1>
          <p className="text-sm text-gray-500 mb-6">
            You need to sign in with an admin account to access this dashboard.
          </p>
          <button
            type="button"
            onClick={openAuth}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
          <p className="text-sm text-gray-500">
            Your account ({user.email}) doesn&apos;t have admin access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Fashion Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Store management</p>
        </div>
        <nav className="p-4 flex lg:flex-col gap-1 overflow-x-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-gray-900'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
                <p className="text-gray-600 mb-8">Overview of your store performance</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <StatCard
                    label="Total Revenue"
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon={<DollarSign className="w-6 h-6" />}
                  />
                  <StatCard label="Total Orders" value={String(orders.length)} icon={<ShoppingCart className="w-6 h-6" />} />
                  <StatCard label="Total Products" value={String(products.length)} icon={<Package className="w-6 h-6" />} />
                  <StatCard label="Total Customers" value={String(customers.length)} icon={<Users className="w-6 h-6" />} />
                </div>

                {lowStockCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-8 text-sm">
                    {lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} low on stock (5 or fewer units left).
                  </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">Recent Orders</h3>
                  </div>
                  <OrdersTable orders={orders.slice(0, 5)} />
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Products</h2>
                    <p className="text-gray-600">Manage your product catalog</p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add Product
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <div className="relative max-w-sm">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500 uppercase text-xs tracking-wider">
                          <th className="px-6 py-3">Product</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Price</th>
                          <th className="px-6 py-3">Stock</th>
                          <th className="px-6 py-3">Badge</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-md object-cover"
                                />
                                <span className="font-medium text-gray-900">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-600 capitalize">{product.category}</td>
                            <td className="px-6 py-3 text-gray-900">${product.price.toFixed(2)}</td>
                            <td className="px-6 py-3">
                              <span className={product.stock <= 5 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {product.badge !== 'None' && (
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    product.badge === 'Sale' ? 'bg-red-100 text-red-700' : 'bg-gray-900 text-white'
                                  }`}
                                >
                                  {product.badge}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                              No products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Orders</h2>
                <p className="text-gray-600 mb-8">Track and manage customer orders</p>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <OrdersTable orders={orders} onStatusChange={handleOrderStatusChange} />
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Customers</h2>
                <p className="text-gray-600 mb-8">View your customer base</p>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-500 uppercase text-xs tracking-wider">
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Orders</th>
                          <th className="px-6 py-3">Total Spent</th>
                          <th className="px-6 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customers.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                            <td className="px-6 py-3 text-gray-600">{c.email}</td>
                            <td className="px-6 py-3 text-gray-600">{c.orders}</td>
                            <td className="px-6 py-3 text-gray-900">${c.totalSpent.toFixed(2)}</td>
                            <td className="px-6 py-3 text-gray-600">{c.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {editingId !== null ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as Product['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                  <select
                    value={form.badge}
                    onChange={e => setForm({ ...form, badge: e.target.value as Product['badge'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="None">None</option>
                    <option value="New">New</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    <Image
                      src={form.image}
                      alt="Preview"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span>{form.image ? 'Change Image' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OrdersTable({
  orders,
  onStatusChange,
}: {
  orders: Order[];
  onStatusChange?: (numericId: number, status: Order['status']) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 uppercase text-xs tracking-wider">
            <th className="py-3 pr-4">Order ID</th>
            <th className="py-3 pr-4">Customer</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Items</th>
            <th className="py-3 pr-4">Total</th>
            <th className="py-3 pr-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-900">{order.id}</td>
              <td className="py-3 pr-4 text-gray-600">{order.customer}</td>
              <td className="py-3 pr-4 text-gray-600">{order.date}</td>
              <td className="py-3 pr-4 text-gray-600">{order.items}</td>
              <td className="py-3 pr-4 text-gray-900">{order.total.toLocaleString()} ETB</td>
              <td className="py-3 pr-4">
                {onStatusChange ? (
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.numericId, e.target.value as Order['status'])}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusStyles[order.status]}`}
                  >
                    {(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}