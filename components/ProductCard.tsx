'use client';

import Link from 'next/link';
import { Product } from '../lib/types';
import { useCart } from '../hooks/useCart';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`Added ${product.name}`, {
      description: `₦${product.price.toLocaleString()}`,
      action: {
        label: "View Cart",
        onClick: () => window.location.href = '/cart',
      },
    });
  };

  const mainImage = product.images[0] || 'https://picsum.photos/id/1011/800/800';

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="product-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3.5] bg-[#111] overflow-hidden">
          <img 
            src={mainImage} 
            alt={product.name}
            className="product-image w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] px-2.5 py-0.5 bg-black/80 text-[#ccc] backdrop-blur font-mono tracking-widest border border-[#333]">
              {product.condition.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info - dark elegant */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="font-medium text-[15px] leading-tight tracking-[-0.2px] group-hover:underline text-white">
                {product.name}
              </div>
              {product.originalBrand && (
                <div className="text-xs text-[#888] mt-0.5">{product.originalBrand}</div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="price font-mono text-sm font-semibold text-[#f5f5f5]">₦{product.price.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#888]">
            <div className="flex gap-2">
              <span>{product.size}</span>
              <span>•</span>
              <span>{product.gender}</span>
            </div>
            <button 
              onClick={handleAdd}
              className="px-3 py-1 bg-[#f5f5f5] text-[#0a0a0a] text-[11px] font-medium hover:bg-white active:scale-[0.985] transition-all"
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
