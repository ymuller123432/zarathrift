'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { getProducts } from '../../../lib/data';
import { useCart } from '../../../hooks/useCart';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const prods = await getProducts();
      setAllProducts(prods);
    })();
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

  const product = allProducts.find(p => p.id === params.id);
  const mainImages = product && product.images && product.images.length > 0 
    ? product.images 
    : ['https://picsum.photos/id/1011/800/800'];

  if (!product) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-[#f5f5f5]">
        <Navbar />
        <div className="zara-container py-20 text-center">
          <p>Piece not found.</p>
          <Link href="/shop" className="underline text-[#ccc]">Back to shop</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`Added to cart`, { description: product.name });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container pt-8 pb-16">
        <Link href="/shop" className="text-sm mb-6 inline-block hover:underline text-[#ccc]">← Back to shop</Link>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Image Gallery */}
          <div>
            <div className="aspect-[4/3.6] bg-[#111] overflow-hidden mb-3 border border-[#222]">
              <img 
                src={mainImages[selectedImage]} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            {mainImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {mainImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 flex-shrink-0 border overflow-hidden ${selectedImage === idx ? 'border-[#f5f5f5]' : 'border-[#333] opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - dark Zara elegant */}
          <div className="pt-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-[#888]">{product.originalBrand || 'Curated'}</div>
                <h1 className="text-4xl tracking-[-1.2px] font-semibold leading-tight mt-1 text-white">{product.name}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-semibold tracking-tighter text-[#f5f5f5]">₦{product.price.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm">
              <div className="px-4 py-1 bg-[#222] text-[#ccc] border border-[#333]">{product.condition}</div>
              <div className="px-4 py-1 bg-[#222] text-[#ccc] border border-[#333]">{product.size}</div>
              <div className="px-4 py-1 bg-[#222] text-[#ccc] border border-[#333]">{product.gender}</div>
              <div className="px-4 py-1 bg-[#222] text-[#ccc] border border-[#333]">{product.category}</div>
            </div>

            <div className="mt-8 text-[15px] leading-relaxed text-[#ccc] whitespace-pre-line">
              {product.description}
            </div>

            {(product.measurements || product.material) && (
              <div className="mt-8 grid grid-cols-2 gap-x-8 text-sm border-t border-[#222] pt-6">
                {product.measurements && (
                  <div>
                    <div className="text-xs text-[#888] mb-1">MEASUREMENTS</div>
                    <div className="text-[#ddd]">{product.measurements}</div>
                  </div>
                )}
                {product.material && (
                  <div>
                    <div className="text-xs text-[#888] mb-1">MATERIAL</div>
                    <div className="text-[#ddd]">{product.material}</div>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              className="mt-10 w-full md:w-auto zara-btn-primary px-14 py-4 font-medium tracking-widest text-sm"
            >
              ADD TO CART — ₦{product.price.toLocaleString()}
            </button>

            <div className="mt-4 text-xs text-[#888]">
              Free delivery on orders above ₦35,000 in Lagos (mainland). Island/Lekki may have small surcharge. Admin confirms exact fee. Nationwide delivery available.
            </div>

            <div className="mt-10 pt-8 border-t border-[#222] text-xs text-[#888] space-y-1">
              <div>• All pieces are pre-loved and sold as seen.</div>
              <div>• We inspect every item for quality before listing.</div>
              <div>• Questions about fit? <a href="https://wa.me/2348012345678" target="_blank" className="underline hover:text-[#ccc]">Message us on WhatsApp</a> with your measurements.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
