'use client';

import { Navbar } from '../../components/Navbar';
import { useCart } from '../../hooks/useCart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="bg-[#0a0a0a] min-h-screen text-[#f5f5f5]">
        <Navbar />
        <div className="zara-container py-24 text-center">
          <h2 className="text-3xl tracking-tight mb-3 text-white">Your cart is empty</h2>
          <p className="text-[#888] mb-8">Start exploring our curated collection.</p>
          <Link href="/shop" className="zara-btn-primary inline-block px-8 py-3 text-sm tracking-widest">BROWSE PIECES</Link>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container py-10">
        <h1 className="text-4xl tracking-[-1.5px] font-semibold mb-8 text-white">Your Cart</h1>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Items */}
          <div className="lg:col-span-7 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="flex gap-5 border-b border-[#222] pb-6">
                <div className="w-28 h-28 bg-[#111] flex-shrink-0 overflow-hidden border border-[#222]">
                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="font-medium leading-tight text-white">{item.name}</div>
                  <div className="text-xs text-[#888] mt-0.5">{item.originalBrand} • {item.size} • {item.condition}</div>

                  <div className="mt-3 flex items-center gap-3 text-sm text-[#ccc]">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border border-[#333] flex items-center justify-center hover:bg-[#222]">-</button>
                    <span className="w-4 text-center font-mono tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border border-[#333] flex items-center justify-center hover:bg-[#222]">+</button>

                    <button onClick={() => removeFromCart(item.id)} className="ml-4 text-xs text-red-400 hover:underline">Remove</button>
                  </div>
                </div>

                <div className="text-right font-mono text-sm whitespace-nowrap pt-1 text-[#f5f5f5]">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Summary - dark */}
          <div className="lg:col-span-5">
            <div className="bg-[#111] border border-[#222] p-6 sticky top-20">
              <div className="font-medium mb-4 text-sm tracking-widest text-[#ccc]">ORDER SUMMARY</div>

              <div className="flex justify-between py-3 border-t border-[#222] text-sm">
                <span>Subtotal</span>
                <span className="font-mono text-[#f5f5f5]">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-[#888]">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="flex justify-between mt-4 pt-4 border-t border-[#222] font-semibold text-lg">
                <span>Total</span>
                <span className="font-mono text-[#f5f5f5]">₦{total.toLocaleString()}</span>
              </div>

              <button 
                onClick={handleCheckout}
                className="mt-6 w-full zara-btn-primary py-4 text-sm tracking-[1.5px]"
              >
                PROCEED TO CHECKOUT
              </button>

              <button onClick={clearCart} className="mt-3 w-full text-xs text-[#888] hover:text-[#ccc]">Clear cart</button>

              <div className="text-[11px] text-center text-[#666] mt-6">
                Manual payment to Moniepoint supported.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
