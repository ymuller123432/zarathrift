'use client';

import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { getProducts } from '../lib/data';
import { ProductCard } from '../components/ProductCard';
import { useState, useEffect } from 'react';

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const all = await getProducts();
      const featuredOnes = all.filter((p: any) => p.featured).slice(0, 6);
      setFeatured(featuredOnes.length > 0 ? featuredOnes : all.slice(0, 6));
    };
    load();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'zarathrift_products') load();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero - Dark, unique, Zara Store inspired (premium minimalist) */}
      <div className="relative h-[92vh] flex items-center justify-center bg-black text-[#f5f5f5] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#222_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-60" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="uppercase tracking-[4px] text-xs mb-4 text-[#888]">CURATED IN NIGERIA</div>
          <h1 className="text-6xl md:text-7xl font-semibold tracking-[-3.5px] leading-none mb-6 text-white">
            TIMELESS.<br />THRIFTED.<br />YOUR STYLE.
          </h1>
          <p className="max-w-md mx-auto text-lg text-[#aaa] mb-10">
            Premium pre-loved fashion. Carefully selected pieces from the best brands.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/shop" 
              className="zara-btn-primary inline-flex h-14 items-center justify-center px-10 font-medium tracking-wide"
            >
              SHOP THE COLLECTION
            </Link>
            <a 
              href="https://wa.me/2348012345678?text=Hi%20Zara%20Thrift%2C%20I%27d%20like%20to%20know%20more%20about%20your%20pieces." 
              target="_blank"
              className="zara-btn-outline inline-flex h-14 items-center justify-center px-10 transition-colors"
            >
              TALK TO US ON WHATSAPP
            </a>
          </div>
          <div className="mt-8 text-[10px] text-[#666] tracking-widest">LAGOS • ABUJA • DELIVERY NATIONWIDE</div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[2px] flex flex-col items-center gap-1 text-[#555]">
          SCROLL TO EXPLORE
          <div className="h-px w-6 bg-[#333]" />
        </div>
      </div>

      {/* Trust bar - dark unique */}
      <div className="border-b border-[#222] bg-[#000] py-3 text-center text-xs text-[#888] tracking-widest">
        QUALITY CHECKED • AUTHENTIC BRANDS • 7-DAY RETURN POLICY ON MOST PIECES
      </div>

      {/* Featured - dark Zara style */}
      <div className="zara-container py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="uppercase text-xs tracking-[2px] text-[#888]">THIS WEEK</div>
            <h2 className="text-4xl tracking-[-1.5px] font-semibold text-white">Featured Pieces</h2>
          </div>
          <Link href="/shop" className="hidden md:block text-sm underline underline-offset-4 hover:no-underline text-[#ccc]">VIEW ALL →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link 
            href="/shop" 
            className="zara-btn-outline inline-block px-8 py-3 text-sm tracking-wider"
          >
            BROWSE THE FULL COLLECTION
          </Link>
        </div>
      </div>

      {/* How it works - dark unique */}
      <div className="border-y border-[#222] py-16 bg-[#000]">
        <div className="zara-container">
          <h3 className="text-center text-sm uppercase tracking-[3px] text-[#888] mb-8">HOW ZARA THRIFT WORKS</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto text-[#ccc]">
            <div>
              <div className="mx-auto w-9 h-9 rounded-full bg-[#f5f5f5] text-[#0a0a0a] flex items-center justify-center text-sm mb-4">1</div>
              <div className="font-medium mb-1 text-white">Browse & Select</div>
              <p className="text-sm text-[#888]">High-quality photos + detailed measurements of every piece.</p>
            </div>
            <div>
              <div className="mx-auto w-9 h-9 rounded-full bg-[#f5f5f5] text-[#0a0a0a] flex items-center justify-center text-sm mb-4">2</div>
              <div className="font-medium mb-1 text-white">Pay to Moniepoint</div>
              <p className="text-sm text-[#888]">Manual transfer to our Moniepoint account. Fast & secure.</p>
            </div>
            <div>
              <div className="mx-auto w-9 h-9 rounded-full bg-[#f5f5f5] text-[#0a0a0a] flex items-center justify-center text-sm mb-4">3</div>
              <div className="font-medium mb-1 text-white">We Deliver</div>
              <p className="text-sm text-[#888]">Nationwide delivery. Lagos same-day / next-day options available.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA - dark */}
      <div className="py-20 text-center zara-container">
        <p className="text-3xl tracking-tight max-w-md mx-auto text-white">Ready to find your next favorite piece?</p>
        <Link href="/shop" className="mt-8 zara-btn-primary inline-block px-9 py-4 text-sm tracking-widest">START SHOPPING</Link>
      </div>

      <footer className="mt-auto border-t border-[#222] py-8 text-xs text-center text-[#666]">
        © {new Date().getFullYear()} Zara Thrift. Not affiliated with Zara. Premium pre-loved fashion in Nigeria.
        <br />
        <a href="https://wa.me/2348012345678" target="_blank" className="underline hover:text-[#aaa]">WhatsApp us</a> for styling advice or bulk orders.
      </footer>
    </div>
  );
}
