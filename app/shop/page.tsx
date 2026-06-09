'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { ProductCard } from '../../components/ProductCard';
import { getProducts } from '../../lib/data';
import { categories, genders, conditions } from '../../lib/products';
import { Product } from '../../lib/types';
import Link from 'next/link';

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Load products from admin-managed localStorage (or defaults)
  useEffect(() => {
    (async () => {
      const prods = await getProducts();
      setAllProducts(prods);
    })();
    // Listen for storage changes (when admin updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zarathrift_products') {
        (async () => {
          const prods = await getProducts();
          setAllProducts(prods);
        })();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Get URL params on client (simple)
  // For production, use useSearchParams from next/navigation

  const filteredProducts = useMemo(() => {
    let result: Product[] = [...allProducts];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.originalBrand?.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Filters
    if (selectedGender !== 'All') {
      result = result.filter(p => p.gender === selectedGender);
    }
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (selectedCondition !== 'All') {
      result = result.filter(p => p.condition === selectedCondition);
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // newest - keep original order or reverse for demo
      result = [...result].reverse();
    }

    return result;
  }, [search, selectedGender, selectedCategory, selectedCondition, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setSelectedGender('All');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container pt-8 pb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-4xl tracking-[-1.5px] font-semibold text-white">Shop</h1>
            <p className="text-[#888] text-sm mt-1">{filteredProducts.length} pieces available</p>
          </div>
          <Link href="/" className="text-sm hidden md:block text-[#ccc]">← Back to home</Link>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col lg:flex-row gap-4">
          <input
            type="text"
            placeholder="Search pieces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-zinc-200 bg-white px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-black"
          />

          <div className="flex flex-wrap gap-2">
            {/* Gender */}
            {genders.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-4 py-1.5 text-xs border transition-colors ${selectedGender === g ? 'filter-active' : 'border-[#333] hover:border-[#555] bg-[#111] text-[#ccc]'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {/* Category */}
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1 text-xs border transition-colors ${selectedCategory === cat ? 'filter-active' : 'border-[#333] bg-[#111] hover:border-[#555] text-[#ccc]'}`}
            >
              {cat}
            </button>
          ))}

          <div className="h-3 w-px bg-[#333] mx-1 hidden sm:block" />

          {/* Condition */}
          {conditions.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCondition(c)}
              className={`px-3 py-1 text-xs border transition-colors ${selectedCondition === c ? 'filter-active' : 'border-[#333] bg-[#111] hover:border-[#555] text-[#ccc]'}`}
            >
              {c}
            </button>
          ))}

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="ml-auto text-xs border bg-[#111] border-[#333] px-3 py-1.5 text-[#ccc] focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          {(search || selectedGender !== 'All' || selectedCategory !== 'All' || selectedCondition !== 'All') && (
            <button onClick={clearFilters} className="text-xs underline ml-2 text-[#888]">Clear all</button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="zara-container pb-20">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 pt-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg text-[#ccc]">No pieces match your filters.</p>
            <button onClick={clearFilters} className="mt-4 text-sm underline text-[#888]">Clear filters</button>
          </div>
        )}
      </div>

      <div className="border-t border-[#222] py-6 text-center text-xs text-[#666]">
        Questions? <a href="https://wa.me/2348012345678" target="_blank" className="underline hover:text-[#aaa]">Message us on WhatsApp</a>
      </div>
    </div>
  );
}
