'use client';

import Link from 'next/link';

interface HeroSectionProps {
  onExploreClick?: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  return (
    <div className="relative bg-gray-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Elevate Your Style
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8">
            Discover our latest arrival collection featuring premium craftsmanship and timeless designs.
          </p>
          <div className="flex gap-4">
            <Link
              href="../newArrival" // Adjust path to match your route setup
              onClick={onExploreClick}
              className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Explore New Arrivals
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
    </div>
  );
}