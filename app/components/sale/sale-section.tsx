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
  daysAgo?: number;
  rating?: number;
  badge?: string | null;
  discount?: number | null;
}

export default function SaleSection() {
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('discount');
  const [discountFilter, setDiscountFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  // Fetch live products from database API & EXCLUDE New Arrivals
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch sale products');
        const data: Product[] = await res.json();

        // ONLY keep items that are ON SALE and NOT NEW
        const saleOnlyProducts = data.filter((product) => {
          const isSaleBadge = product.badge?.toLowerCase() === 'sale';
          const hasDiscount = Boolean(product.discount && product.discount > 0);
          const hasOriginalPriceDiscount = Boolean(
            product.originalPrice && Number(product.originalPrice) > Number(product.price)
          );

          // Must have a discount/sale marker
          const isOnSale = isSaleBadge || hasDiscount || hasOriginalPriceDiscount;

          // Exclude items explicitly marked 'New' or added within the last 14 days without sale markers
          const isNewBadge = product.badge?.toLowerCase() === 'new';
          const isRecentArrival = (product.daysAgo ?? 99) <= 14;

          return isOnSale && !isNewBadge && !(isRecentArrival && !isSaleBadge);
        });

        setProducts(saleOnlyProducts);
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
    if (!confirm('Are you sure you want to delete this sale item?')) return;

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
      { id: 'all', name: 'All Sale Items', count: products.length },
      { id: 'men', name: 'Men', count: products.filter((p) => p.category === 'men').length },
      { id: 'women', name: 'Women', count: products.filter((p) => p.category === 'women').length },
      { id: 'kids', name: 'Kids', count: products.filter((p) => p.category === 'kids').length },
    ];
  }, [products]);

  // Calculate percentage discount helper
  const getDiscountPercent = (product: Product) => {
    if (product.discount) return product.discount;
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  // Dynamic Filtering and Sorting
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category Filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Discount Filter
        const discount = getDiscountPercent(product);
        if (discountFilter === '10-20' && (discount < 10 || discount > 20)) return false;
        if (discountFilter === '20-30' && (discount < 20 || discount > 30)) return false;
        if (discountFilter === '30-40' && (discount < 30 || discount > 40)) return false;
        if (discountFilter === '40+' && discount < 40) return false;

        // Price Filter (in Birr)
        const price = Number(product.price);
        if (priceRange === 'under2000' && price >= 2000) return false;
        if (priceRange === '2000to5000' && (price < 2000 || price > 5000)) return false;
        if (priceRange === '5000to10000' && (price < 5000 || price > 10000)) return false;
        if (priceRange === 'over10000' && price <= 10000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'discount') return getDiscountPercent(b) - getDiscountPercent(a);
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [products, selectedCategory, discountFilter, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Special Sale</h1>
          <p className="text-xl text-red-50">
            Up to 50% off on selected items - Limited time deals!
          </p>
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
                          ? 'bg-red-600 text-white'
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

              {/* Discount Range */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Discount</h3>
                <select
                  value={discountFilter}
                  onChange={(e) => setDiscountFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="all">All Discounts</option>
                  <option value="10-20">10% - 20% Off</option>
                  <option value="20-30">20% - 30% Off</option>
                  <option value="30-40">30% - 40% Off</option>
                  <option value="40+">40% or More</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
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
                  Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> sale products
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                  >
                    <option value="discount">Highest Discount</option>
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
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-medium">{error}</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-500">
                No sale items match your selected filters.
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map((product) => {
                  const discountPct = getDiscountPercent(product);
                  const originalPrice = product.originalPrice
                    ? Number(product.originalPrice)
                    : null;
                  const currentPrice = Number(product.price);
                  const savings = originalPrice ? originalPrice - currentPrice : 0;

                  return (
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

                          {/* Discount Badge */}
                          {discountPct > 0 && (
                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white shadow-md">
                              {discountPct}% OFF
                            </span>
                          )}

                          {/* Top Right Action Controls */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                            
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() =>
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: currentPrice,
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
                          <h3 className="font-medium text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
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

                      <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-red-600 text-lg">
                          {currentPrice.toFixed(2)} Birr
                        </span>
                        {originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {originalPrice.toFixed(2)} Birr
                          </span>
                        )}
                        {savings > 0 && (
                          <span className="text-xs text-red-600 font-semibold w-full">
                            Save {savings.toFixed(2)} Birr
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}