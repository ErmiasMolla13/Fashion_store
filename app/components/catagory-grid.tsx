'use client';

import Image from 'next/image';

interface CategoryGridProps {
  onSelectCategory?: (category: string) => void;
}

export function CategoryGrid({ onSelectCategory }: CategoryGridProps) {
  const categories = [
    {
      id: 'men',
      name: 'Men',
      image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=600&fit=crop',
    },
    {
      id: 'women',
      name: 'Women',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&fit=crop',
    },
    {
      id: 'kids',
      name: 'Kids',
      image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=600&fit=crop',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Category</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory?.(cat.id)}
            className="group relative h-96 rounded-xl overflow-hidden cursor-pointer shadow-md"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold">{cat.name}</h3>
              <p className="text-sm font-medium underline mt-1">Shop Now &rarr;</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}