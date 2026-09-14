'use client';

import { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, Heart, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import useCart from '../context/CartContext';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  badge?: 'New' | 'Sale' | 'None' | null;
  rating?: number;
}

export default function KidsSection() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');

  // Fetch live products from database API
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();

        // Filter specifically for kids' categories
        const kidsProducts = data.filter((p: Product) =>
          ['kids', 'boys', 'girls', 'babies', 'shoes', 'accessories'].includes(p.category)
        );
        setProducts(kidsProducts.length > 0 ? kidsProducts : data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Handle product deletion via Dynamic Route (/api/products/[id])
  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setDeletingId(productId);

      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete product');
      }

      // Update UI state dynamically without requiring page reload
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'boys', name: 'Boys' },
    { id: 'girls', name: 'Girls' },
    { id: 'babies', name: 'Babies & Toddlers' },
    { id: 'shoes', name: 'Kids Shoes' },
    { id: 'accessories', name: 'Accessories' },
  ];

  // Apply Category, Price Filter, and Sorting dynamically
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category Filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Price Filter
        const price = Number(product.price);
        if (priceRange === 'under25' && price >= 2500) return false;
        if (priceRange === '25to50' && (price < 2500 || price > 5000)) return false;
        if (priceRange === '50to75' && (price < 5000 || price > 7500)) return false;
        if (priceRange === 'over75' && price <= 7500) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return b.id - a.id;
        return 0; // Default featured
      });
  }, [products, selectedCategory, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Kids Collection</h1>
          <p className="text-xl text-gray-300">Discover adorable styles for your little ones</p>
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
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="all">All Prices</option>
                  <option value="under25">Under 2500 Birr</option>
                  <option value="25to50">2500 - 5000 Birr</option>
                  <option value="50to75">5000 - 7500 Birr</option>
                  <option value="over75">Over 7500 Birr</option>
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
                  Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> products
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading / Error / Empty States */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-medium">{error}</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-500">
                No products found matching your filters.
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

                        {/* Badge */}
                        {product.badge && product.badge !== 'None' && (
                          <span
                            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${
                              product.badge === 'Sale'
                                ? 'bg-red-600 text-white'
                                : 'bg-black text-white'
                            }`}
                          >
                            {product.badge}
                          </span>
                        )}

                        {/* Top-Right Action Buttons */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                          
                        </div>

                        {/* Add To Cart Button */}
                        <button
                          onClick={() =>
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: Number(product.price),
                              image: product.image,
                              category: 'kids',
                            })
                          }
                          className="absolute bottom-4 left-4 right-4 bg-gray-900 text-white py-3 rounded-lg font-medium transition-all hover:bg-gray-800 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
                        >
                          Add to Cart
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                          {product.name}
                        </h3>

                        {/* Star Rating */}
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
                          <span className="text-sm text-gray-600 ml-1">({product.rating || 5.0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">
                        {Number(product.price).toFixed(2)} Birr
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {Number(product.originalPrice).toFixed(2)} Birr
                        </span>
                      )}
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