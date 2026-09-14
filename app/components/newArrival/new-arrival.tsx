'use client';

import { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, Heart, Sparkles, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import useCart from '../context/CartContext';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  daysAgo?: number;
  rating?: number;
  badge?: string | null;
  discount?: number | null;
}

export default function NewArrivalsSection() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [arrivalDateFilter, setArrivalDateFilter] = useState('all');

  // Fetch live products from database API & filter out sale items
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data: Product[] = await res.json();

        // ONLY keep items that are NOT on sale
        const newOnlyProducts = data.filter((product) => {
          const isSaleBadge = product.badge?.toLowerCase() === 'sale';
          const hasDiscount = Boolean(product.discount && product.discount > 0);
          const hasOriginalPriceDiscount = Boolean(
            product.originalPrice && product.originalPrice > product.price
          );

          return !isSaleBadge && !hasDiscount && !hasOriginalPriceDiscount;
        });

        setProducts(newOnlyProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Handle product deletion via API
  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this new arrival?')) return;

    try {
      setDeletingId(productId);

      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  // Dynamic Categories with live item counts
  const categories = useMemo(() => {
    return [
      { id: 'all', name: 'All New Arrivals', count: products.length },
      { id: 'men', name: 'Men', count: products.filter((p) => p.category === 'men').length },
      { id: 'women', name: 'Women', count: products.filter((p) => p.category === 'women').length },
      { id: 'kids', name: 'Kids', count: products.filter((p) => p.category === 'kids').length },
    ];
  }, [products]);

  // Dynamic Filtering and Sorting
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category Filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Arrival Date Filter
        const daysAgo = product.daysAgo ?? 1;
        if (arrivalDateFilter === 'today' && daysAgo > 1) return false;
        if (arrivalDateFilter === 'week' && daysAgo > 7) return false;
        if (arrivalDateFilter === '2weeks' && daysAgo > 14) return false;
        if (arrivalDateFilter === 'month' && daysAgo > 30) return false;

        // Price Filter (in Birr)
        const price = Number(product.price);
        if (priceRange === 'under2000' && price >= 2000) return false;
        if (priceRange === '2000to5000' && (price < 2000 || price > 5000)) return false;
        if (priceRange === '5000to10000' && (price < 5000 || price > 10000)) return false;
        if (priceRange === 'over10000' && price <= 10000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (a.daysAgo ?? 0) - (b.daysAgo ?? 0);
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [products, selectedCategory, arrivalDateFilter, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-5xl font-bold">New Arrivals</h1>
          </div>
          <p className="text-xl text-purple-50">Just landed - Explore our latest full-price releases</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4 shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-sm font-medium">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrival Date */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Arrival Date</h3>
                <select
                  value={arrivalDateFilter}
                  onChange={(e) => setArrivalDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="2weeks">Last 14 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">All Prices</option>
                  <option value="under2000">Under 2000 Birr</option>
                  <option value="2000to5000">2000 - 5000 Birr</option>
                  <option value="5000to10000">5000 - 10000 Birr</option>
                  <option value="over10000">Over 10000 Birr</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> new products
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading / Error / Empty States */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-medium">{error}</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-500">
                No new arrivals found matching your current filter choices.
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between relative"
                  >
                    <div>
                      <div className="relative overflow-hidden aspect-3/4">
                        <Image
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          width={300}
                          height={400}
                        />

                        {/* Arrival Tag */}
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3" />
                          {!product.daysAgo || product.daysAgo === 1
                            ? 'Just In'
                            : `${product.daysAgo} Days Ago`}
                        </span>

                        {/* Top Right Action Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                          
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() =>
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: Number(product.price),
                              image: product.image,
                              category: product.category,
                            })
                          }
                          className="absolute bottom-4 left-4 right-4 bg-gray-900 text-white py-3 rounded-lg font-medium transition-all hover:bg-gray-800 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
                        >
                          Add to Cart
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                          {product.name}
                        </h3>

                        {/* Ratings */}
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating || 5)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300 fill-current'
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                          <span className="text-sm text-gray-600 ml-1">
                            ({product.rating || 5.0})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">
                        {Number(product.price).toFixed(2)} Birr
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}