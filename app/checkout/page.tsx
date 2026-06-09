'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { Navbar } from '../../components/Navbar';
import { getSettings, getDiscounts } from '../../lib/data';
import { getCurrentUser } from '../../lib/auth';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara", "FCT (Abuja)"
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, total, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [bizConfig, setBizConfig] = useState<any>({});

  // Preserve order summary values for success screen (after cart is cleared)
  const [orderSummary, setOrderSummary] = useState<{ total: number; discount: number; discountCode: string }>({
    total: 0,
    discount: 0,
    discountCode: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    state: 'Lagos',
    city: '',
    notes: '',
    paymentMethod: 'moniepoint' as 'moniepoint',
  });

  // Receipt upload removed per user request - only manual Moniepoint payment details shown
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setBizConfig(s);
      const discs = await getDiscounts();
      setAvailableDiscounts(discs.filter((d: any) => d.active));
    })();

    // Force login before checkout
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // Prefill from logged in user
    setFormData(prev => ({
      ...prev,
      name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      phone: currentUser.phone,
      email: currentUser.email || prev.email,
    }));
  }, [router]);

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div>
        <Navbar />
        <div className="zara-container py-20 text-center">Your cart is empty. <Link href="/shop" className="underline">Go shopping</Link></div>
      </div>
    );
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateReference = () => {
    const short = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ZT-${short}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in your name, phone and delivery address');
      return;
    }

    setIsSubmitting(true);

    const reference = generateReference();
    const finalTotal = Math.max(0, total - appliedDiscount);

    // Capture summary before clearing cart
    setOrderSummary({
      total: finalTotal,
      discount: appliedDiscount,
      discountCode: discountCode,
    });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 650));

    // In real app: Save to Supabase / backend here
    const order = {
      id: Date.now().toString(36),
      reference,
      items: cart,
      total: finalTotal,
      customer: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        state: formData.state,
        city: formData.city,
        notes: formData.notes,
      },
      paymentMethod: formData.paymentMethod,
      paymentStatus: 'pending' as const,
      status: 'pending-verification' as const,
      createdAt: new Date().toISOString(),
      discountCode: appliedDiscount > 0 ? discountCode : undefined,
      discountAmount: appliedDiscount,
      deliveryFee: 0, // Admin will calculate & set final amount for Lagos orders
      deliveryNotes: undefined,
      trackingUpdates: [{ status: 'pending', date: new Date().toISOString(), note: 'Order received' }],
    };

    // Store in localStorage for demo (admin can see)
    const existingOrders = JSON.parse(localStorage.getItem('zarathrift_orders') || '[]');
    localStorage.setItem('zarathrift_orders', JSON.stringify([order, ...existingOrders]));

    setOrderRef(reference);
    setOrderPlaced(true);
    clearCart();
    setIsSubmitting(false);

    toast.success('Order placed successfully!', {
      description: `Reference: ${reference}. We will contact you shortly.`,
    });
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
        <Navbar />
        <div className="zara-container max-w-lg py-16">
          <h1 className="text-4xl tracking-tight font-semibold mb-2 text-white">Thank you!</h1>
          <p className="text-xl text-[#ccc]">Your order has been received.</p>

          <div className="mt-10 bg-[#111] border border-[#222] p-6 text-sm checkout-card">
            <div className="font-mono text-xs mb-1 text-[#888]">ORDER REFERENCE</div>
            <div className="font-semibold text-2xl tracking-widest mb-4 text-white">{orderRef}</div>

            <div className="border-t border-[#222] pt-4 space-y-1">
              <div><span className="text-[#888]">Items:</span> ₦{orderSummary.total.toLocaleString()} {orderSummary.discount > 0 ? `(-₦${orderSummary.discount} via ${orderSummary.discountCode})` : ''}</div>
              <div><span className="text-[#888]">Delivery (Lagos):</span> (free over ₦35k mainland / higher for Island). Final amount confirmed via WhatsApp.</div>
              <div><span className="text-[#888]">Payment:</span> Moniepoint Bank Transfer</div>
              <div className="pt-1"><span className="text-[#888]">Delivery address:</span> {formData.address}, {formData.city}, {formData.state}</div>
            </div>
          </div>

          <div className="mt-8 p-6 border border-[#222] bg-[#111] text-sm">
            <div className="font-medium mb-3 text-[#ccc]">Please complete payment to our Moniepoint account:</div>
            <div className="font-mono space-y-1 text-[#ddd]">
              <div>Bank: <span className="font-semibold text-white">{bizConfig.bankName}</span></div>
              <div>Account Name: <span className="font-semibold text-white">{bizConfig.accountName}</span></div>
              <div>Account Number: <span className="font-semibold text-lg text-white">{bizConfig.accountNumber}</span></div>
              <div className="pt-1">Reference: <span className="font-semibold text-white">{orderRef}</span></div>
            </div>
            <div className="mt-3 text-xs text-[#888]">After paying, reply this message on WhatsApp with your order reference so we can verify quickly.</div>
          </div>

          <div className="mt-8">
            <a 
              href={`https://wa.me/${bizConfig.whatsappNumber}?text=Hi%20Zara%20Thrift%2C%20I%20just%20placed%20order%20${orderRef}.%20Please%20confirm%20my%20order.`}
              target="_blank"
              className="whatsapp-btn inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded text-sm font-medium"
            >
              MESSAGE US ON WHATSAPP →
            </a>
          </div>

          <div className="mt-4">
            <Link 
              href={`/track?ref=${orderRef}`}
              className="inline-block text-sm underline text-[#aaa] hover:text-white"
            >
              Track your order →
            </Link>
          </div>

          <p className="text-xs mt-6 text-[#666]">We will verify your payment and send WhatsApp updates for: Accepted → Shipped → Delivered.</p>

          {!getCurrentUser() && (
            <p className="text-center text-xs mt-4 text-[#888]">
              <Link href="/login" className="underline">Login</Link> or <Link href="/register" className="underline">Register</Link> to autofill your details next time.
            </p>
          )}

          <Link href="/shop" className="text-xs underline mt-8 block text-[#888] hover:text-[#ccc]">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container py-10 max-w-2xl">
        <h1 className="text-3xl tracking-tight font-semibold mb-1 text-white">Checkout</h1>
        <p className="text-sm text-[#888] mb-8">Total: ₦{total.toLocaleString()} {appliedDiscount > 0 ? `(-₦${appliedDiscount})` : ''}</p>

        {getCurrentUser() && (
          <div className="mb-4 text-xs text-[#888]">
            Logged in as <span className="text-[#f5f5f5]">{getCurrentUser()?.firstName} {getCurrentUser()?.lastName}</span> ({getCurrentUser()?.phone})
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div>
            <div className="font-medium text-sm mb-3 tracking-widest text-[#ccc]">YOUR DETAILS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="name" value={formData.name} onChange={handleInput} required placeholder="Full name" className="border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" />
              <input name="phone" value={formData.phone} onChange={handleInput} required placeholder="Phone number (WhatsApp preferred)" className="border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" />
            </div>
            <input name="email" value={formData.email} onChange={handleInput} placeholder="Email (optional)" className="mt-3 w-full border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" />
          </div>

          {/* Delivery */}
          <div>
            <div className="font-medium text-sm mb-3 tracking-widest text-[#ccc]">DELIVERY ADDRESS</div>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleInput} 
              required 
              rows={3} 
              placeholder="Street address, landmark, area" 
              className="w-full border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" 
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#888] mb-1 block">State</label>
                <select 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInput} 
                  className="w-full border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]"
                >
                  {nigerianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888] mb-1 block">City / Town</label>
                <input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInput} 
                  placeholder="City / Town" 
                  className="w-full border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" 
                />
              </div>
            </div>
          </div>

          <div>
            <div className="font-medium text-sm mb-3 tracking-widest text-[#ccc]">ADDITIONAL NOTES</div>
            <textarea name="notes" value={formData.notes} onChange={handleInput} rows={2} placeholder="Delivery instructions, preferred time, etc." className="w-full border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" />
          </div>

          {/* Discount Codes */}
          <div>
            <div className="font-medium text-sm mb-3 tracking-widest text-[#ccc]">DISCOUNT CODE</div>
            <div className="flex gap-2">
              <input 
                value={discountCode} 
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} 
                placeholder="e.g. THRIFT10" 
                className="flex-1 border px-4 py-2.5 bg-[#111] border-[#333] text-[#f5f5f5]" 
              />
              <button 
                type="button" 
                onClick={() => {
                  const match = availableDiscounts.find((d: any) => d.code === discountCode && d.active);
                  if (match) {
                    const disc = Math.round(total * (match.percent / 100));
                    setAppliedDiscount(disc);
                    toast.success(`${match.percent}% off applied!`);
                  } else {
                    setAppliedDiscount(0);
                    toast.error('Invalid or inactive code');
                  }
                }}
                className="px-4 border text-sm border-[#333] hover:bg-[#222]"
              >
                APPLY
              </button>
            </div>
            {appliedDiscount > 0 && <div className="text-xs text-emerald-400 mt-1">Discount: -₦{appliedDiscount}</div>}
            {availableDiscounts.length > 0 && <div className="text-[10px] text-[#666] mt-1">Active codes: {availableDiscounts.map((d:any)=>d.code).join(', ')}</div>}
          </div>

          {/* Payment Method - Only Moniepoint (manual transfer) */}
          <div>
            <div className="font-medium text-sm mb-3 tracking-widest text-[#ccc]">PAYMENT METHOD</div>
            <div className="p-3 border border-[#333] bg-[#111] text-sm">
              <div className="font-medium">Moniepoint Bank Transfer (only option)</div>
              <div className="text-xs text-[#888] mt-1">You will see the exact account details after placing your order. Transfer the total and message us on WhatsApp with your order reference for quick verification.</div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-4 zara-btn-primary disabled:bg-[#555] py-4 text-sm tracking-[1.5px] font-medium"
          >
            {isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
          </button>

          <p className="text-[11px] text-center text-[#666]">We will contact you via WhatsApp to confirm payment and delivery.</p>
        </form>
      </div>
    </div>
  );
}
