'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Order } from '../../lib/types';
import { getOrders } from '../../lib/data';
import { toast } from 'sonner';

interface TrackingStep {
  label: string;
  active: boolean;
  date?: string;
}

function getTrackingSteps(order: Order): TrackingStep[] {
  const status = order.status;
  const updates = order.trackingUpdates || [];

  const findDate = (s: string) => {
    const u = updates.find(x => x.status === s);
    return u ? new Date(u.date).toLocaleDateString() : undefined;
  };

  const placedDate = new Date(order.createdAt).toLocaleDateString();

  const steps: TrackingStep[] = [
    { label: 'Order Placed', active: true, date: placedDate },
    { label: 'Confirmed', active: ['accepted', 'shipped', 'delivered'].includes(status), date: findDate('accepted') },
    { label: 'Shipped', active: ['shipped', 'delivered'].includes(status), date: findDate('shipped') },
    { label: 'Delivered', active: status === 'delivered', date: findDate('delivered') },
  ];

  if (status === 'cancelled') {
    return [
      { label: 'Order Placed', active: true, date: placedDate },
      { label: 'Cancelled', active: true, date: findDate('cancelled') || new Date().toLocaleDateString() },
    ];
  }

  return steps;
}

// Simple simulated route map positions for visual "live bike route"
// Uses deliveryUpdates sequence to draw a growing path on a fake Lagos-style map
function getSimulatedRoutePoints(deliveryUpdates: any[] = []) {
  if (!deliveryUpdates || deliveryUpdates.length === 0) return [];
  return deliveryUpdates.map((u, i) => {
    const progress = deliveryUpdates.length > 1 ? i / (deliveryUpdates.length - 1) : 0;
    // Create a simple curving path across the "map" area (300x180 viewBox)
    const x = 35 + (progress * 230);
    const y = 45 + Math.sin(i * 1.2) * 38 + (i % 3) * 8; // gentle wave for "streets"
    return {
      x: Math.max(30, Math.min(270, x)),
      y: Math.max(25, Math.min(155, y)),
      location: u.location,
      time: new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });
}

async function findOrder(query: string): Promise<Order | null> {
  if (!query.trim()) return null;
  try {
    const all: Order[] = await getOrders();
    const q = query.trim().toUpperCase();
    return all.find(o =>
      o.reference.toUpperCase() === q ||
      (o.trackingNumber && o.trackingNumber.toUpperCase() === q)
    ) || null;
  } catch {
    return null;
  }
}

import { Suspense } from 'react';

function TrackPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto search from URL ?ref=...
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setQuery(ref);
      (async () => {
        const found = await findOrder(ref);
        setOrder(found);
        setSearched(true);
        if (!found) {
          toast.error('Order not found');
        }
      })();
    }
  }, [searchParams]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const found = await findOrder(query);
    setOrder(found);
    setSearched(true);
    if (!found) {
      toast.error('No matching order found. Check the reference or tracking number.');
    } else {
      toast.success('Order found');
    }
  };

  const copyTracking = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      toast.success('Tracking number copied');
    }
  };

  const steps = order ? getTrackingSteps(order) : [];
  const isCancelled = order?.status === 'cancelled';

  // Progress percentage for the bar
  const activeCount = steps.filter(s => s.active).length;
  const progressPct = steps.length > 1 ? Math.min(100, Math.round(((activeCount - 1) / (steps.length - 1)) * 100)) : 100;

  const waMessage = order 
    ? `Hi Zara Thrift, I am tracking order ${order.reference}${order.trackingNumber ? ` (tracking ${order.trackingNumber})` : ''}. Can you give me an update?`
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container max-w-xl py-12">
        <div className="mb-8">
          <h1 className="text-4xl tracking-[-1.5px] font-semibold mb-1">Track Order</h1>
          <p className="text-[#888]">Enter your order reference (ZT-XXXXXX) or tracking number (ZARA...)</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ZT-ABC123 or ZARA1234567890"
            className="flex-1 border border-[#333] bg-[#111] px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#666]"
            autoFocus
          />
          <button 
            type="submit"
            className="px-8 py-3 bg-white text-[#0a0a0a] text-sm font-medium tracking-widest hover:bg-[#f5f5f5] transition"
          >
            TRACK
          </button>
          <button 
            type="button"
            onClick={async () => { if (query) { const f = await findOrder(query); setOrder(f); if (f) toast.success('Refreshed'); else toast.error('Still not found'); } }}
            className="px-4 py-3 border border-[#333] text-xs text-[#888] hover:text-white hover:border-[#555]"
          >
            REFRESH
          </button>
        </form>

        {/* Result */}
        {searched && order && (
          <div className="bg-[#111] border border-[#222] p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] tracking-[2px] text-[#888] mb-1">ORDER REFERENCE</div>
                <div className="font-mono text-2xl tracking-[1px]">{order.reference}</div>
              </div>
              <div className={`px-3 py-1 text-xs rounded ${isCancelled ? 'bg-red-900/30 text-red-400' : order.status === 'delivered' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-[#222] text-[#ccc]'}`}>
                {order.status.toUpperCase()}
              </div>
            </div>

            {/* Tracking Number */}
            {order.trackingNumber ? (
              <div className="mb-6 p-4 bg-[#0a0a0a] border border-[#333]">
                <div className="text-[10px] text-[#888] mb-1 tracking-widest">TRACKING NUMBER</div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-lg text-emerald-400">{order.trackingNumber}</div>
                  <button onClick={copyTracking} className="text-xs underline text-[#888] hover:text-white">COPY</button>
                </div>
                <p className="text-[10px] text-[#666] mt-1">Use this number with our delivery partner or ask us for updates.</p>
              </div>
            ) : (
              <div className="mb-6 text-sm text-[#888]">
                Tracking number will be assigned once your order ships. You will receive it via WhatsApp.
              </div>
            )}

            {/* Estimated Delivery (set by admin) */}
            {order.estimatedDelivery && (
              <div className="mb-5 p-3 bg-[#0f1f14] border border-emerald-900/60 text-sm flex items-center gap-2">
                <div className="text-emerald-400">📅</div>
                <div>
                  <span className="text-emerald-400 font-medium tracking-wide text-xs">ESTIMATED DELIVERY</span>
                  <div className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            )}

            {/* Logistic Bike + Movement (when assigned) */}
            {order.assignedBike && (
              <div className="mb-5 p-3 bg-[#111] border border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-400">🚲</span>
                  <span className="font-medium text-sm">DELIVERED BY BIKE</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{order.assignedBike.riderName}</span> on <span className="font-mono text-emerald-400">{order.assignedBike.bikeNumber}</span>
                </div>
                {order.currentLocation && (
                  <div className="mt-1 text-emerald-400 text-sm">Last seen: <span className="font-medium">{order.currentLocation}</span></div>
                )}
                {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
                  <div className="mt-2 text-xs text-[#888]">
                    {order.deliveryUpdates.length} live movement updates • order is moving
                  </div>
                )}
                {order.deliveryUpdates?.some(u => u.lat && u.lng) && (
                  <div className="mt-1 text-[10px] text-emerald-300">Real GPS coordinates captured for this route</div>
                )}
              </div>
            )}

            {/* Dedicated recent bike movements (so customer sees the order actually moving) */}
            {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] tracking-[1.5px] text-emerald-400 mb-1">BIKE MOVEMENTS (LIVE UPDATES)</div>
                <div className="text-xs bg-[#0a0a0a] border border-[#222] p-2 space-y-1.5">
                  {order.deliveryUpdates.slice().reverse().slice(0, 5).map((u, i) => (
                    <div key={i} className="text-[#ccc]">
                      <div className="flex gap-2">
                        <span className="text-[#666] tabular-nums shrink-0">{new Date(u.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <span>at <span className="font-medium text-emerald-400">{u.location}</span>{u.note ? ` — ${u.note}` : ''}</span>
                      </div>
                      {u.lat && u.lng && (
                        <div className="ml-14 text-[10px] text-emerald-300 font-mono flex items-center gap-2">
                          GPS: {u.lat.toFixed(6)}, {u.lng.toFixed(6)}
                          <a 
                            href={`https://www.google.com/maps?q=${u.lat},${u.lng}`} 
                            target="_blank" 
                            className="underline text-emerald-400 hover:text-white"
                          >
                            Open in Google Maps →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#555] mt-1">Admin updates this live as the bike moves. Refresh the page or re-search to see newest.</div>
              </div>
            )}

            {/* Live Bike Route Visual (SVG simulated map) */}
            {order.deliveryUpdates && order.deliveryUpdates.length > 1 && (() => {
              const points = getSimulatedRoutePoints(order.deliveryUpdates);
              if (points.length < 2) return null;
              const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
              const last = points[points.length - 1];
              return (
                <div className="mb-6">
                  <div className="text-[10px] tracking-[1.5px] text-emerald-400 mb-1">LIVE BIKE ROUTE MAP</div>
                  <div className="border border-[#333] bg-[#0a0a0a] p-2">
                    <svg width="100%" height="170" viewBox="0 0 300 170" style={{ background: '#111' }}>
                      {/* Fake map background / roads */}
                      <rect x="0" y="0" width="300" height="170" fill="#1a1a1a" rx="4" />
                      {/* Rough road grid for "Lagos" feel */}
                      <line x1="25" y1="55" x2="275" y2="55" stroke="#2a2a2a" strokeWidth="12" />
                      <line x1="25" y1="115" x2="275" y2="115" stroke="#2a2a2a" strokeWidth="12" />
                      <line x1="70" y1="25" x2="70" y2="145" stroke="#2a2a2a" strokeWidth="8" />
                      <line x1="180" y1="25" x2="180" y2="145" stroke="#2a2a2a" strokeWidth="8" />

                      {/* The actual bike route path (grows as admin adds movements) */}
                      <polyline 
                        points={pathPoints} 
                        fill="none" 
                        stroke="#4ade80" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        strokeDasharray="6 3"
                      />

                      {/* Points along the route */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={i === points.length - 1 ? 6 : 3.5} 
                            fill={i === points.length - 1 ? "#fff" : "#4ade80"} 
                            stroke="#0a0a0a" 
                            strokeWidth="1.5"
                          />
                          {i === points.length - 1 && (
                            <text x={p.x + 9} y={p.y - 7} fill="#4ade80" fontSize="8" fontWeight="bold">BIKE</text>
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="text-[9px] text-[#666] mt-1">
                    Route grows in real time as you add movements in admin. Latest position is the white dot.
                  </div>
                  <div className="text-[9px] text-[#555] mt-1">Admin adds points by using the inline GPS form on the order in the admin panel.</div>
                </div>
              );
            })()}

            {/* Real GPS Route - Google Maps integration for actual live tracking */}
            {order.deliveryUpdates && order.deliveryUpdates.some((u: any) => u.lat && u.lng) && (
              <div className="mb-6">
                <div className="text-[10px] tracking-[1.5px] text-emerald-400 mb-1">REAL GPS ROUTE</div>
                <a
                  href={(() => {
                    const pts = order.deliveryUpdates.filter((u: any) => u.lat && u.lng);
                    if (pts.length === 0) return '#';
                    const origin = `${pts[0].lat},${pts[0].lng}`;
                    const dest = `${pts[pts.length-1].lat},${pts[pts.length-1].lng}`;
                    const wps = pts.slice(1, -1).map((p: any) => `${p.lat},${p.lng}`).join('|');
                    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${wps ? `&waypoints=${wps}` : ''}`;
                  })()}
                  target="_blank"
                  className="block w-full text-center py-2.5 border border-emerald-700 text-emerald-400 text-sm hover:bg-emerald-950/30"
                >
                  Open Full Live Bike Route in Google Maps →
                </a>
                <div className="text-[9px] text-[#555] mt-1 text-center">Opens with all captured GPS points as a real driving/walking route.</div>
              </div>
            )}

            {/* Visual Progress - prettier stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-[10px] tracking-[1.5px] text-[#888] mb-2">
                <div>PROGRESS</div>
                {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                  <div className="normal-case font-mono text-[9px] text-[#555]">
                    Updated {new Date(order.trackingUpdates[order.trackingUpdates.length-1].date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {isCancelled ? (
                <div className="flex items-center gap-3 text-red-400 py-1">
                  <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center text-xs">✕</div>
                  <div className="text-sm font-medium">Order cancelled by request or admin</div>
                </div>
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="h-[3px] bg-[#222] rounded mb-4 overflow-hidden">
                    <div className="h-[3px] bg-white transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>

                  {/* Step circles + labels */}
                  <div className="flex justify-between items-start">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center w-16 text-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 mb-1.5 transition-colors ${step.active 
                          ? 'bg-white text-[#0a0a0a] border-white' 
                          : 'bg-[#0a0a0a] text-[#444] border-[#333]'}`}>
                          {step.active ? '✓' : (idx + 1)}
                        </div>
                        <div className={`text-[10px] leading-tight font-medium ${step.active ? 'text-white' : 'text-[#555]'}`}>
                          {step.label}
                        </div>
                        {step.date && (
                          <div className="text-[9px] text-[#666] mt-0.5 tabular-nums">{step.date}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Timeline */}
            {order.trackingUpdates && order.trackingUpdates.length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] tracking-[1.5px] text-[#888] mb-2">HISTORY</div>
                <ul className="space-y-1.5 text-sm text-[#ccc]">
                  {[...order.trackingUpdates]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((u, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#666] font-mono text-xs w-20 shrink-0 pt-px">{new Date(u.date).toLocaleDateString()}</span>
                        <span>
                          <span className="font-medium">{u.status}</span>
                          {u.note ? <span className="text-[#888]"> — {u.note}</span> : null}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            <div className="border-t border-[#222] pt-4 text-sm space-y-1 text-[#ccc]">
              <div>{order.items.length} item(s) • ₦{order.total.toLocaleString()}</div>
              <div>Delivering to: {order.customer.city}{order.customer.state ? `, ${order.customer.state}` : ''}</div>
              {order.deliveryFee ? <div>Delivery fee: ₦{order.deliveryFee}</div> : null}
            </div>

            {/* Map / Live tracking placeholder */}
            <div className="mt-4 pt-3 border-t border-[#222] text-[10px] text-[#666]">
              Live map &amp; courier location tracking coming soon. Ask us on WhatsApp with your tracking number for immediate position updates.
            </div>

            {/* Help */}
            <div className="mt-6 pt-4 border-t border-[#333] flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/2348012345678?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                className="flex-1 text-center py-2.5 border border-[#444] text-sm hover:bg-[#222] transition"
              >
                MESSAGE US ON WHATSAPP
              </a>
              <Link href="/account" className="flex-1 text-center py-2.5 border border-[#444] text-sm hover:bg-[#222] transition">
                VIEW IN MY ACCOUNT
              </Link>
            </div>
          </div>
        )}

        {/* Not found */}
        {searched && !order && (
          <div className="bg-[#111] border border-[#222] p-6 text-sm">
            <p className="mb-3">We couldn't find an order matching that reference or tracking number.</p>
            <ul className="text-[#888] text-xs space-y-1 list-disc pl-4">
              <li>Make sure you copied the full reference (starts with ZT-).</li>
              <li>Tracking numbers start with ZARA followed by 10 digits.</li>
              <li>Orders are only visible after you complete checkout.</li>
            </ul>
            <p className="mt-4 text-xs">
              Still having trouble? <a href="https://wa.me/2348012345678" target="_blank" className="underline">Chat with us on WhatsApp</a>.
            </p>
          </div>
        )}

        {!searched && (
          <div className="text-xs text-[#666] mt-2">
            Tip: After placing an order you will also receive the reference via WhatsApp.
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/shop" className="text-xs text-[#888] underline hover:text-[#ccc]">Back to shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] flex items-center justify-center">Loading track page...</div>}>
      <TrackPageContent />
    </Suspense>
  );
}
