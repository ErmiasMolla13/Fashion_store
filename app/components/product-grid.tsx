'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, ShoppingBag, Sparkles } from 'lucide-react';

// ✅ Correct relative import from app/components/ to app/components/context/
import useCart from './context/CartContext';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface ProductGridProps {
  onCategoryClick?: (category: string) => void;
}

// ✅ Named export for reusable component
export function ProductGrid({ onCategoryClick }: ProductGridProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data.slice(0, 6));
          }
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
        <p className="text-xs text-slate-500 font-medium">Curating top picks...</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Handpicked
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Featured Products
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative flex flex-col rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name || 'Product'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
                />
              )}

              {product.category && (
                <button
                  type="button"
                  onClick={() => onCategoryClick?.(product.category.toLowerCase())}
                  className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide text-white hover:bg-indigo-600 shadow-sm transition-colors cursor-pointer"
                >
                  {product.category}
                </button>
              )}

              <div className="absolute inset-x-2 bottom-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: Number(product.price) || 0,
                      image: product.image,
                      category: product.category,
                    })
                  }
                  className="w-full bg-indigo-600 text-white py-2 px-3 rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95  opacity-100 translate-y-0md:opacity-0 md:translate-y-2 md:group-hover:translate-y-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5" 
                  />
                  Add to Cart
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-3.5 bg-white">
              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>

              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  {Number(product.price || 0).toLocaleString()}{' '}
                  <span className="text-[10px] font-medium text-slate-500">ETB</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}