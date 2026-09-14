"use client";

import { useState } from 'react';
import  MenSection from './components/menProducts/men-section';
import WomenSection from './components/womenProducts/women-section';
import  KidsSection  from './components/kidsProduct/kids-section';
import SaleSection  from './components/sale/sale-section';
import NewArrivalsSection  from './components/newArrival/new-arrival';

// Import your Home components
import { HeroSection } from './components/hero-section';
import { CategoryGrid } from './components/catagory-grid';
import { ProductGrid } from './components/product-grid';

export default function App() {
  // 1. Updated state type to include 'home' and set it as default
  const [activeTab, setActiveTab] = useState<'home' | 'men' | 'women' | 'kids' | 'sale' | 'new-arrivals'>('home');

  return (
      <div className="min-h-screen bg-white">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {/* 2. Added Home Button */}
              <button
                onClick={() => setActiveTab('home')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Home
              </button>

              <button
                onClick={() => setActiveTab('men')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'men'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Men
              </button>
              
              <button
                onClick={() => setActiveTab('women')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'women'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Women
              </button>

              <button
                onClick={() => setActiveTab('kids')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'kids'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kids
              </button>

              <button
                onClick={() => setActiveTab('new-arrivals')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'new-arrivals'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-purple-500 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                New Arrivals
              </button>

              <button
                onClick={() => setActiveTab('sale')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'sale'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-red-500 hover:text-red-600 hover:border-red-300'
                }`}
              >
                Sale
              </button>
            </div>
          </div>
        </div>

        {/* 3. Conditional Content Rendering */}
        <main>
          {activeTab === 'home' && (
            <>
              <HeroSection />
              <CategoryGrid />
              <ProductGrid />
            </>
          )}

          {activeTab === 'men' && <MenSection />}
          {activeTab === 'women' && <WomenSection />}
          {activeTab === 'kids' && <KidsSection />}
          {activeTab === 'new-arrivals' && <NewArrivalsSection />}
          {activeTab === 'sale' && <SaleSection />}
        </main>
      </div>
  );
}