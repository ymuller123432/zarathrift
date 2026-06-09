'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { getCurrentUser, logout } from '../../lib/auth';
import { User, Order } from '../../lib/types';
import { getOrders } from '../../lib/data';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.push('/login');
      return;
    }
    setUser(current);

    // Load user's orders by phone (via data layer for Supabase support / live sync)
    (async () => {
      try {
        const allOrders: Order[] = await getOrders();
        const userOrders = allOrders
          .filter(o => o.customer.phone === current.phone)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyOrders(userOrders);
      } catch {}
    })();
  }, [router]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    router.push('/');
  };

  const requestCancelOrRefund = (orderId: string, type: 'cancel' | 'refund') => {
    const reason = prompt(`Please provide a reason for the ${type} request (optional):`);
    if (reason === null) return; // user cancelled prompt

    try {
      const allOrders: Order[] = JSON.parse(localStorage.getItem('zarathrift_orders') || '[]');
      const updatedOrders = allOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            cancelRequest: {
              type,
              requestedAt: new Date().toISOString(),
              reason: reason || undefined,
              adminStatus: 'pending' as const,
            },
          };
        }
        return o;
      });
      localStorage.setItem('zarathrift_orders', JSON.stringify(updatedOrders));
      // Refresh the list
      if (user) {
        const userOrders = updatedOrders
          .filter(o => o.customer.phone === user.phone)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyOrders(userOrders);
      }
      toast.success(`${type === 'cancel' ? 'Cancellation' : 'Refund'} request submitted. Admin will review.`);
    } catch (e) {
      toast.error('Failed to submit request');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
        <Navbar />
        <div className="zara-container py-20 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />

      <div className="zara-container max-w-md py-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">My Account</h1>
        <p className="text-[#888] mb-8">Welcome back, {user.firstName}.</p>

        <div className="bg-[#111] border border-[#222] p-6 rounded space-y-4">
          <div>
            <div className="text-xs text-[#888]">NAME</div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
          </div>

          <div>
            <div className="text-xs text-[#888]">PHONE (for login)</div>
            <div className="font-medium">{user.phone}</div>
          </div>

          {user.email && (
            <div>
              <div className="text-xs text-[#888]">EMAIL (for login)</div>
              <div className="font-medium">{user.email}</div>
            </div>
          )}

          <div>
            <div className="text-xs text-[#888]">MEMBER SINCE</div>
            <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link 
            href="/shop" 
            className="zara-btn-primary text-center py-3 text-sm tracking-widest"
          >
            CONTINUE SHOPPING
          </Link>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-sm text-[#888] hover:text-white py-2"
          >
            <span>Logout</span>
          </button>
        </div>

        {/* My Orders */}
        <div className="mt-8">
          <h2 className="font-medium mb-3">My Orders ({myOrders.length})</h2>
          {myOrders.length === 0 ? (
            <p className="text-sm text-[#888]">No orders yet. Start shopping!</p>
          ) : (
            <div className="space-y-3">
              {myOrders.slice(0, 5).map(order => (
                <div key={order.id} className="bg-[#111] border border-[#222] p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono">{order.reference}</span>
                    <span className="text-[#888]">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span>₦{order.total.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  {order.trackingNumber && (
                    <Link href={`/track?ref=${order.trackingNumber}`} className="mt-1 text-[10px] text-[#aaa] hover:text-emerald-400 underline">Tracking: {order.trackingNumber} →</Link>
                  )}
                  {order.estimatedDelivery && (
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</div>
                  )}
                  {order.assignedBike && (
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      🚲 {order.assignedBike.bikeNumber} ({order.assignedBike.riderName}){order.currentLocation ? ` • ${order.currentLocation}` : ''}
                    </div>
                  )}
                  {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                    <details className="mt-2 text-[10px] text-[#666]">
                      <summary className="cursor-pointer">Full Tracking History ({order.trackingUpdates.length})</summary>
                      <ul className="pl-3 mt-1 space-y-1">
                        {order.trackingUpdates.map((u, i) => (
                          <li key={i}>
                            • {u.status} on {new Date(u.date).toLocaleString()}
                            {u.note ? ` — ${u.note}` : ''}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="text-[#666] mt-0.5 truncate">{order.items.length} item(s)</div>
                  {/* Cancel/Refund request UI (only for open orders) */}
                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <div className="mt-2 pt-2 border-t border-[#333]">
                      {order.cancelRequest && order.cancelRequest.adminStatus === 'pending' ? (
                        <div className="text-[10px] text-amber-400">
                          {order.cancelRequest.type === 'cancel' ? 'Cancellation' : 'Refund'} requested — awaiting admin review.
                        </div>
                      ) : order.cancelRequest && order.cancelRequest.adminStatus === 'approved' ? (
                        <div className="text-[10px] text-emerald-400">
                          {order.cancelRequest.type === 'cancel' ? 'Cancellation' : 'Refund'} approved by admin.
                        </div>
                      ) : order.cancelRequest && order.cancelRequest.adminStatus === 'rejected' ? (
                        <div className="text-[10px] text-red-400">
                          Request rejected.
                          <button onClick={() => requestCancelOrRefund(order.id, 'cancel')} className="ml-2 underline hover:text-white">Request Cancel</button>
                          <button onClick={() => requestCancelOrRefund(order.id, 'refund')} className="ml-2 underline hover:text-white">Request Refund</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 text-[10px]">
                          <button 
                            onClick={() => requestCancelOrRefund(order.id, 'cancel')} 
                            className="px-2 py-0.5 border border-[#444] hover:bg-[#222] text-[#888]"
                          >
                            Request Cancellation
                          </button>
                          <button 
                            onClick={() => requestCancelOrRefund(order.id, 'refund')} 
                            className="px-2 py-0.5 border border-[#444] hover:bg-[#222] text-[#888]"
                          >
                            Request Refund
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick track link for any order */}
                  <div className="mt-2">
                    <Link 
                      href={`/track?ref=${order.trackingNumber || order.reference}`} 
                      className="text-[10px] text-[#888] underline hover:text-white"
                    >
                      Track full details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[#555] mt-8">
          Your orders are associated with your phone number.
        </p>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-900/30 text-amber-400';
    case 'accepted': return 'bg-blue-900/30 text-blue-400';
    case 'shipped': return 'bg-purple-900/30 text-purple-400';
    case 'delivered': return 'bg-emerald-900/30 text-emerald-400';
    case 'cancelled': return 'bg-red-900/30 text-red-400';
    default: return 'bg-[#222] text-[#888]';
  }
}
