'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Order, Product } from '../../lib/types';
import { businessConfig } from '../../lib/config';
import { getProducts, saveProducts, getSettings, saveSettings, generateId, getCustomers, saveCustomerNote, getDiscounts, saveDiscounts, getContent, saveContent, saveOrders, getOrders } from '../../lib/data';
import { toast } from 'sonner';

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reports' | 'customers' | 'settings' | 'content'>('dashboard');

  // Product form state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [conditionCloseups, setConditionCloseups] = useState<string[]>([]);

  // New feature states
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [orderFilters, setOrderFilters] = useState({ status: 'all', dateFrom: '', dateTo: '' });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // For discount generation form (better than prompt)
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);

  const ADMIN_USERNAME = 'admin123';
  const ADMIN_PASSWORD = 'Chikenfood!1';

  // Dynamic Logistic Bikes fleet (admin can create/edit)
  const [bikes, setBikes] = useState<any[]>([]);
  const [newBikeRider, setNewBikeRider] = useState('');
  const [newBikeNumber, setNewBikeNumber] = useState('');

  // Inline movement form state for nice UX (replaces old prompts)
  // Keyed by orderId
  const [movementForm, setMovementForm] = useState<Record<string, { location: string; note?: string; lat?: number; lng?: number }>>({});

  useEffect(() => {
    // Auto-login if previously authenticated in this browser session
    const wasAuthed = localStorage.getItem('zarathrift_admin_authed');
    if (wasAuthed === 'true') {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthed) {
      const savedOrders = localStorage.getItem('zarathrift_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }

      // Load bikes (admin-managed fleet)
      const savedBikes = localStorage.getItem('zarathrift_bikes');
      if (savedBikes) {
        setBikes(JSON.parse(savedBikes));
      } else {
        // Seed initial bikes on first run
        const initialBikes = [
          { bikeId: 'b1', riderName: 'Chinedu', bikeNumber: 'NG-LOG-042' },
          { bikeId: 'b2', riderName: 'Fatima', bikeNumber: 'NG-LOG-017' },
          { bikeId: 'b3', riderName: 'Emeka', bikeNumber: 'NG-LOG-089' },
        ];
        setBikes(initialBikes);
        localStorage.setItem('zarathrift_bikes', JSON.stringify(initialBikes));
      }

      // Load products (admin managed) - now async capable
      (async () => {
        const prods = await getProducts();
        setProducts(prods);
      })();

      // Load settings, discounts, customers, content
      (async () => {
        const s = await getSettings();
        setSettings(s);
        setDiscounts((s as any).discounts || []);
        setContent((s as any).content || {});
      })();

      (async () => {
        const custs = await getCustomers();
        setCustomers(custs);
      })();
    }
  }, [isAuthed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthed(true);
      setUsername('');
      setPassword('');
      // Persist auth for this demo session
      localStorage.setItem('zarathrift_admin_authed', 'true');
    } else {
      toast.error('Invalid username or password');
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status'], newPaymentStatus?: Order['paymentStatus']) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          status: newStatus,
          paymentStatus: newPaymentStatus || order.paymentStatus,
        };

        // Auto-generate tracking number (ZARA + 10 digits) when shipping if not set
        if (newStatus === 'shipped' && !updatedOrder.trackingNumber) {
          updatedOrder.trackingNumber = generateTrackingNumber();
        }

        // Auto-set a reasonable estimated delivery when shipping (if not already set)
        if (newStatus === 'shipped' && !updatedOrder.estimatedDelivery) {
          const d = new Date();
          d.setDate(d.getDate() + 4); // ~4 days for Lagos thrift delivery
          updatedOrder.estimatedDelivery = d.toISOString();
        }

        // Clear delivery notes when shipped (tracking number is now the focus for customer)
        if (newStatus === 'shipped') {
          delete updatedOrder.deliveryNotes;
        }

        // Add to tracking history
        const newUpdate = {
          status: newStatus,
          date: new Date().toISOString(),
          note: getStatusNote(newStatus),
        };
        updatedOrder.trackingUpdates = [...(order.trackingUpdates || []), newUpdate];

        return updatedOrder;
      }
      return order;
    });

    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success(`Order marked as ${newStatus}`);

    // Smarter WhatsApp prompt: only auto-prompt on shipped and delivered
    const order = orders.find(o => o.id === orderId);
    if (order && ['shipped', 'delivered'].includes(newStatus)) {
      const message = buildWhatsAppMessage(order, newStatus);
      const waUrl = `https://wa.me/${order.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      if (confirm(`Notify customer via WhatsApp that order is ${newStatus}?`)) {
        window.open(waUrl, '_blank');
      }
    }
  };

  const getStatusNote = (status: string) => {
    switch (status) {
      case 'accepted': return 'Order accepted and being prepared';
      case 'shipped': return 'Order has been shipped';
      case 'delivered': return 'Order delivered successfully';
      default: return '';
    }
  };

  const buildWhatsAppMessage = (order: any, status: string) => {
    const base = `Hi ${order.customer.name.split(' ')[0]}, update for your order ${order.reference}:`;
    const trackingLine = order.trackingNumber ? `\nTracking Number: ${order.trackingNumber}` : '';
    const bikeLine = order.assignedBike ? `\nDelivery bike: ${order.assignedBike.bikeNumber} (Rider: ${order.assignedBike.riderName})` : '';

    switch (status) {
      case 'accepted':
        const notesLine = order.deliveryNotes ? `\nNotes: ${order.deliveryNotes}` : '';
        return `${base} Your order has been ACCEPTED and is being prepared for delivery. We'll update you soon!${notesLine}`;
      case 'shipped':
        return `${base} Great news! Your order has been SHIPPED.${trackingLine}${bikeLine}\nPlease use the tracking number above to follow your delivery. It should arrive soon. Reply here if you have questions.`;
      case 'delivered':
        return `${base} Your order has been DELIVERED. Thank you for shopping with Zara Thrift! We hope you love your new pieces.`;
      default:
        return `${base} Status updated to ${status}.${trackingLine}${bikeLine}`;
    }
  };

  const markAccepted = (orderId: string) => {
    updateOrderStatus(orderId, 'accepted', 'verified');
  };

  const markShipped = (orderId: string) => {
    updateOrderStatus(orderId, 'shipped');
  };

  const markDelivered = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
  };

  const approveCancelRequest = (orderId: string) => {
    const updated = orders.map(order => {
      if (order.id === orderId && order.cancelRequest) {
        const updatedOrder = {
          ...order,
          status: 'cancelled' as const,
          cancelRequest: {
            ...order.cancelRequest,
            adminStatus: 'approved' as const,
          },
        };
        // Add tracking update
        const newUpdate = {
          status: 'cancelled',
          date: new Date().toISOString(),
          note: `${order.cancelRequest.type} request approved by admin`,
        };
        updatedOrder.trackingUpdates = [...(order.trackingUpdates || []), newUpdate];
        return updatedOrder;
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success('Cancel/Refund request approved and order cancelled');
  };

  const rejectCancelRequest = (orderId: string) => {
    const updated = orders.map(order => {
      if (order.id === orderId && order.cancelRequest) {
        return {
          ...order,
          cancelRequest: {
            ...order.cancelRequest,
            adminStatus: 'rejected' as const,
          },
        };
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success('Request rejected');
  };

  const deleteOrder = (orderId: string) => {
    if (!confirm('Delete this order permanently?')) return;
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success('Order deleted');
  };

  // === LAGOS DELIVERY CALCULATION (used by admin) ===
  const calculateLagosDelivery = (order: any, currentSettings: any) => {
    const itemsTotal = order.total || 0;
    const freeThreshold = currentSettings.lagosFreeThreshold ?? 35000;
    if (itemsTotal >= freeThreshold) return 0;

    const city = (order.customer?.city || '').toLowerCase();
    const address = (order.customer?.address || '').toLowerCase() + ' ' + (order.customer?.state || '').toLowerCase();

    const isLagos = city.includes('lagos') || address.includes('lagos');
    if (!isLagos) return currentSettings.lagosDeliveryFee ?? 2500; // fallback for non-Lagos

    const isIsland = ['victoria', 'ikoyi', 'lekki', 'ajah', 'epe', 'island', 'ikate'].some(area => 
      city.includes(area) || address.includes(area)
    );

    if (isIsland) {
      return (currentSettings.lagosMainlandFee ?? 2000) + (currentSettings.lagosIslandSurcharge ?? 1500);
    }
    return currentSettings.lagosMainlandFee ?? currentSettings.lagosDeliveryFee ?? 2500;
  };

  const generateTrackingNumber = () => {
    // ZARA + 10 random digits
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10);
    return `ZARA${randomDigits}`;
  };

  // === LOGISTIC BIKE HELPERS ===
  const assignBikeToOrder = (orderId: string, bike: { bikeId: string; riderName: string; bikeNumber: string }) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          assignedBike: bike,
        };
        // Auto add an initial delivery update + set shipped if not already
        const initialUpdate = {
          timestamp: new Date().toISOString(),
          location: 'Assigned to bike - preparing for dispatch',
          note: `Bike ${bike.bikeNumber} (Rider: ${bike.riderName}) assigned`,
        };
        updatedOrder.deliveryUpdates = [...(order.deliveryUpdates || []), initialUpdate];
        if (updatedOrder.status !== 'shipped' && updatedOrder.status !== 'delivered') {
          updatedOrder.status = 'shipped';
        }
        if (!updatedOrder.trackingNumber) {
          updatedOrder.trackingNumber = generateTrackingNumber();
        }
        // Add to general tracking history too
        updatedOrder.trackingUpdates = [...(order.trackingUpdates || []), {
          status: 'shipped',
          date: new Date().toISOString(),
          note: `Assigned bike ${bike.bikeNumber} - Rider ${bike.riderName}`,
        }];
        return updatedOrder;
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success(`Bike ${bike.bikeNumber} assigned to order`);
  };

  const clearBikeAssignment = (orderId: string) => {
    if (!confirm('Remove bike assignment from this order?')) return;
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const { assignedBike, deliveryUpdates, currentLocation, ...rest } = order;
        return { ...rest, deliveryUpdates: deliveryUpdates || [] }; // keep history if wanted
      }
      return order;
    });
    setOrders(updated);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
    toast.success('Bike assignment removed');
  };

  // === BIKE FLEET MANAGEMENT (admin creates bikes) ===
  const saveBikes = (newBikes: any[]) => {
    setBikes(newBikes);
    localStorage.setItem('zarathrift_bikes', JSON.stringify(newBikes));
  };

  const addNewBike = () => {
    if (!newBikeRider.trim() || !newBikeNumber.trim()) {
      toast.error('Please enter rider name and bike number');
      return;
    }
    const newBike = {
      bikeId: 'bike_' + Date.now(),
      riderName: newBikeRider.trim(),
      bikeNumber: newBikeNumber.trim().toUpperCase(),
    };
    const updated = [...bikes, newBike];
    saveBikes(updated);
    setNewBikeRider('');
    setNewBikeNumber('');
    toast.success(`Bike ${newBike.bikeNumber} added to fleet`);
  };

  const editBike = (bikeId: string) => {
    const bike = bikes.find((b: any) => b.bikeId === bikeId);
    if (!bike) return;
    const newRider = prompt('Update rider name:', bike.riderName);
    if (newRider === null) return;
    const newNum = prompt('Update bike number:', bike.bikeNumber);
    if (newNum === null) return;

    const updated = bikes.map((b: any) =>
      b.bikeId === bikeId
        ? { ...b, riderName: newRider.trim(), bikeNumber: newNum.trim().toUpperCase() }
        : b
    );
    saveBikes(updated);
    toast.success('Bike details updated');
  };

  const deleteBike = (bikeId: string) => {
    if (!confirm('Delete this bike from the fleet? (Already assigned orders will keep the old details)')) return;
    const updated = bikes.filter((b: any) => b.bikeId !== bikeId);
    saveBikes(updated);
    toast.success('Bike removed from fleet');
  };

  // === NICE INLINE MOVEMENT FORM (replaces ugly prompts) + Real GPS ===
  const captureCurrentGPS = (orderId: string) => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.info('Getting your current GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMovementForm(prev => ({
          ...prev,
          [orderId]: {
            ...(prev[orderId] || { location: '' }),
            lat: latitude,
            lng: longitude
          }
        }));
        toast.success(`GPS captured: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (err) => {
        toast.error(`Could not get location: ${err.message}. Make sure you allowed location access.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const updateMovementInput = (orderId: string, field: 'location' | 'note' | 'lat' | 'lng', value: string | number) => {
    setMovementForm(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { location: '' }),
        [field]: value
      }
    }));
  };

  const submitInlineMovement = (orderId: string) => {
    const formData = movementForm[orderId];
    if (!formData || !formData.location.trim()) {
      toast.error('Please enter a location description');
      return;
    }

    const location = formData.location.trim();
    const note = formData.note?.trim() || undefined;
    const lat = formData.lat;
    const lng = formData.lng;

    // Build the update object with real GPS if available
    const newUpdate: any = {
      timestamp: new Date().toISOString(),
      location,
      note,
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
    };

    // Update the order
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          deliveryUpdates: [...(order.deliveryUpdates || []), newUpdate],
          currentLocation: location,
        };

        // Also append to general trackingUpdates so history shows it
        updatedOrder.trackingUpdates = [
          ...(order.trackingUpdates || []),
          {
            status: 'moving',
            date: newUpdate.timestamp,
            note: `Bike at ${location}${newUpdate.lat && newUpdate.lng ? ` (GPS: ${newUpdate.lat.toFixed(5)}, ${newUpdate.lng.toFixed(5)})` : ''}${note ? ` — ${note}` : ''}`,
          }
        ];

        // Make sure status reflects it's moving
        if (updatedOrder.status === 'pending' || updatedOrder.status === 'accepted') {
          updatedOrder.status = 'shipped';
        }

        return updatedOrder;
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem('zarathrift_orders', JSON.stringify(updatedOrders));

    // Clear only this order's form
    setMovementForm(prev => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });

    toast.success('Movement added with real GPS (if captured). Customers will see it live on the track page.');
  };

  // All movement adding now uses the nice inline form + real GPS (see the "LOGISTIC BIKE" section inside each order card).
  // No more prompt() calls.

  // === PRODUCT MANAGEMENT ===
  const saveProduct = () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.price) {
      toast.error('Name and price are required');
      return;
    }

    const productToSave: Product = {
      id: editingProduct.id || generateId(),
      name: editingProduct.name,
      price: Number(editingProduct.price),
      originalBrand: editingProduct.originalBrand,
      size: editingProduct.size || 'M',
      condition: editingProduct.condition || 'Good',
      gender: editingProduct.gender || 'Unisex',
      category: editingProduct.category || 'Tops',
      description: editingProduct.description || '',
      images: productImages.length > 0 ? productImages : ['https://picsum.photos/id/1011/800/800'],
      measurements: editingProduct.measurements,
      material: editingProduct.material,
      inStock: editingProduct.inStock !== false,
      quantity: editingProduct.quantity ?? 1,
      featured: !!editingProduct.featured,
    };

    let updatedProducts;
    if (editingProduct.id) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? productToSave : p);
    } else {
      updatedProducts = [...products, productToSave];
    }

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    toast.success(editingProduct.id ? 'Item updated!' : 'New item added!');

    // Reset form
    setEditingProduct(null);
    setProductImages([]);
  };

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setProductImages(product.images || []);
  };

  const deleteProduct = (id: string) => {
    if (!confirm('Delete this item?')) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
    toast.success('Item deleted');
  };

  const startNewProduct = () => {
    setEditingProduct({
      name: '',
      price: 5000,
      size: 'M',
      condition: 'Good',
      gender: 'Unisex',
      category: 'Tops',
      description: '',
      inStock: true,
    });
    setProductImages([]);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setProductImages([]);
  };

  // Handle multiple image uploads (convert to data URLs for persistence)
  const handleProductImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let loaded = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newImages.push(ev.target.result as string);
        }
        loaded++;
        if (loaded === files.length) {
          setProductImages(prev => [...prev, ...newImages]);
          toast.success(`${files.length} photo(s) added`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProductImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setPhotoCaptions(prev => prev.filter((_, i) => i !== index));
    setConditionCloseups(prev => prev.filter((_, i) => i !== index));
  };

  // Better photo UX: set primary, captions, closeups
  const setPrimaryImage = (index: number) => {
    const imgs = [...productImages];
    const caps = [...photoCaptions];
    const close = [...conditionCloseups];
    [imgs[0], imgs[index]] = [imgs[index], imgs[0]];
    if (caps.length) [caps[0], caps[index]] = [caps[index], caps[0]];
    if (close.length) [close[0], close[index]] = [close[index], close[0]];
    setProductImages(imgs);
    setPhotoCaptions(caps);
    setConditionCloseups(close);
    toast.success('Primary image updated');
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    const caps = [...photoCaptions];
    caps[index] = caption;
    setPhotoCaptions(caps);
  };

  const handleConditionCloseups = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Similar to handleProductImages but for closeups
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setConditionCloseups(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Discount codes - now with proper form in admin UI (no prompt)
  const addDiscount = () => {
    const code = newDiscountCode.trim().toUpperCase();
    if (!code) {
      toast.error('Enter a discount code');
      return;
    }
    if (discounts.some((d: any) => d.code === code)) {
      toast.error('Code already exists');
      return;
    }
    const percent = Math.max(1, Math.min(100, newDiscountPercent));
    const newD = { code, percent, active: true };
    const updated = [...discounts, newD];
    setDiscounts(updated);
    saveDiscounts(updated);
    setNewDiscountCode('');
    setNewDiscountPercent(10);
    toast.success(`Discount ${code} (${percent}% off) added! It will appear in customer checkout.`);
  };

  const toggleDiscount = (code: string) => {
    const updated = discounts.map(d => d.code === code ? { ...d, active: !d.active } : d);
    setDiscounts(updated);
    saveDiscounts(updated);
  };

  // Customer CRM
  const saveCustomerNoteLocal = async (phone: string, name: string, notes: string) => {
    await saveCustomerNote(phone, name, notes, customers.find(c => c.phone === phone)?.ordersCount || 1);
    const updated = await getCustomers();
    setCustomers(updated);
    setEditingCustomer(null);
    toast.success('Customer note saved');
  };

  // Content management
  const saveContentForm = async (newContent: Record<string, string>) => {
    const updated = { ...content, ...newContent };
    setContent(updated);
    await saveContent(updated);
    toast.success('Homepage content saved! Refresh home to see.');
  };

  // Reports helpers
  const filteredOrdersForReport = orders.filter(o => {
    const d = new Date(o.createdAt);
    const fromOk = !orderFilters.dateFrom || d >= new Date(orderFilters.dateFrom);
    const toOk = !orderFilters.dateTo || d <= new Date(orderFilters.dateTo);
    const statusOk = orderFilters.status === 'all' || o.status === orderFilters.status;
    return fromOk && toOk && statusOk;
  });

  const categoryRevenue = filteredOrdersForReport.flatMap(o => o.items).reduce((acc: any, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    return acc;
  }, {});

  // Order extras
  const updateOrderNotes = (orderId: string, notes: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, adminNotes: notes } : o);
    setOrders(updated);
    saveOrders(updated);
    toast.success('Admin note saved');
  };

  const printReceipt = (order: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<pre style="font-family:monospace; padding:20px;">
ZARA THRIFT - RECEIPT
Order: ${order.reference}
Date: ${new Date(order.createdAt).toLocaleString()}
Customer: ${order.customer.name} (${order.customer.phone})
Address: ${order.customer.address}, ${order.customer.city}${order.customer.state ? `, ${order.customer.state}` : ''}

Items:
${order.items.map((i:any) => `• ${i.name} x${i.quantity} - ₦${(i.price*i.quantity).toLocaleString()}`).join('\n')}

${order.discountCode ? `Discount: ${order.discountCode} (-₦${(order.discountAmount || 0).toLocaleString()})\n` : ''}Total: ₦${order.total.toLocaleString()}
Payment: ${order.paymentMethod} (${order.paymentStatus})
Status: ${order.status}
${order.adminNotes ? 'Notes: ' + order.adminNotes : ''}
Thank you for shopping with us!
</pre>`);
    w.print();
    w.close();
  };

  const bulkUpdateStatus = (newStatus: string) => {
    if (selectedOrders.length === 0) return;
    const updated = orders.map(o => selectedOrders.includes(o.id) ? { ...o, status: newStatus as any } : o);
    setOrders(updated);
    saveOrders(updated);
    setSelectedOrders([]);
    toast.success(`Updated ${selectedOrders.length} orders to ${newStatus}`);
  };

  // Fake automation / fun buttons
  const fakeMarketPriceCheck = (product: any) => {
    const fakePrice = Math.round(product.price * (0.8 + Math.random() * 0.4));
    toast(`Market price check: Similar items selling for ₦${fakePrice} - ₦${Math.round(fakePrice*1.2)} on local markets. Your price looks good!`);
  };

  const fakeGenerateDescription = (product: any) => {
    const desc = `This ${product.condition.toLowerCase()} ${product.name.toLowerCase()} from ${product.originalBrand || 'a premium brand'} is in excellent condition. Perfect for ${product.gender.toLowerCase()} looking for timeless style. Measurements: ${product.measurements || 'standard fit'}. Grab it before it's gone!`;
    setEditingProduct({ ...product, description: desc });
    toast.success('AI-generated description applied (demo)');
  };

  const sendAutoWhatsApp = (order: any) => {
    const template = `Hi ${order.customer.name.split(' ')[0]}, your Zara Thrift order ${order.reference} has been ${order.status}. Total ₦${order.total}. Track here or reply for updates.`;
    window.open(`https://wa.me/${order.customer.phone.replace(/\D/g,'')}?text=${encodeURIComponent(template)}`, '_blank');
  };

  const checkLowStock = (product: any) => {
    if ((product.quantity || 1) < 2) {
      toast.error(`Low stock warning: Only ${product.quantity || 1} left for ${product.name}`);
    } else {
      toast.success('Stock looks good.');
    }
  };

  // Similar items suggestion (fake)
  const suggestSimilar = (product: any) => {
    const similar = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
    toast(`Similar items: ${similar.map(s => s.name).join(', ') || 'None found'}`);
  };

  // === SETTINGS ===
  const saveSettingsForm = (newSettings: any) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
    toast.success('Settings saved! (Affects future checkouts on refresh)');
  };

  // === DASHBOARD STATS (imaginary but useful) ===
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'verified' || o.status !== 'pending')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalProducts = products.length;

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
        <Navbar />
        <div className="zara-container max-w-sm py-20">
          <h2 className="text-xl font-medium mb-2">Admin Access</h2>
          <p className="text-sm text-[#888] mb-6">Login to manage orders</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Username" 
              className="w-full bg-[#111] border border-[#333] p-3 text-[#f5f5f5] placeholder-[#666]" 
              autoFocus 
              autoComplete="username"
            />
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Password" 
              className="w-full bg-[#111] border border-[#333] p-3 text-[#f5f5f5] placeholder-[#666]" 
              autoComplete="current-password"
            />
            <button type="submit" className="w-full bg-[#f5f5f5] text-[#0a0a0a] py-3 text-sm hover:bg-white transition-colors font-medium">LOGIN</button>
          </form>
          <p className="text-xs mt-4 text-[#666]">Use the credentials provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#f5f5f5]">
      <Navbar />
      <div className="zara-container py-8 text-[#f5f5f5]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl tracking-tight font-semibold">Zara Thrift Admin</h1>
            <p className="text-sm text-[#888]">Everything runs through here — products, orders, settings</p>
          </div>
          <button 
            onClick={() => {
              setIsAuthed(false);
              localStorage.removeItem('zarathrift_admin_authed');
            }} 
            className="text-sm text-[#888] hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#222] mb-6 flex-wrap">
          {(['dashboard', 'products', 'orders', 'reports', 'customers', 'settings', 'content'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-[#f5f5f5] text-white' : 'border-transparent text-[#888] hover:text-[#ccc]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#888]">TOTAL PRODUCTS</div>
                <div className="text-3xl font-semibold text-white">{totalProducts}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#888]">PENDING VERIFICATION</div>
                <div className="text-3xl font-semibold text-amber-400">{pendingOrders}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#888]">VERIFIED REVENUE</div>
                <div className="text-3xl font-semibold text-white">₦{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4">
                <div className="text-xs text-[#888]">TOTAL ORDERS</div>
                <div className="text-3xl font-semibold">{orders.length}</div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-6">
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setActiveTab('products'); startNewProduct(); }} className="px-4 py-2 bg-black text-white text-sm">+ Add New Thrift Item</button>
                <button onClick={() => setActiveTab('orders')} className="px-4 py-2 border text-sm">Manage Orders</button>
                <button onClick={() => setActiveTab('settings')} className="px-4 py-2 border text-sm">Update Business Details</button>
                <a href="/shop" target="_blank" className="px-4 py-2 border text-sm">View Live Shop →</a>
                <button 
                  onClick={() => {
                    // Re-seed demo products if needed
                    (async () => {
                      const defaults = await getProducts();
                      if (defaults.length < 5) {
                        await saveProducts(defaults);
                        setProducts(defaults);
                        toast.success('Default products restored');
                      }
                    })();
                  }} 
                  className="px-4 py-2 border text-sm"
                >
                  Restore Default Products
                </button>
              </div>
              <p className="text-xs text-[#888] mt-4">Tip: Add/edit products here → they appear live in the shop (refresh shop page or wait for storage sync).</p>
            </div>

            {/* Imaginary Analytics / Reports */}
            <div className="mt-6 bg-[#111] border border-[#222] p-6">
              <h3 className="font-medium mb-3">Quick Reports (from your orders)</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Top Categories Sold</div>
                  <ul className="mt-2 text-xs">
                    {Object.entries(
                      orders.flatMap(o => o.items).reduce((acc: any, item) => {
                        acc[item.category] = (acc[item.category] || 0) + item.quantity;
                        return acc;
                      }, {})
                    ).sort((a:any,b:any)=>b[1]-a[1]).slice(0,3).map(([cat, count]:any) => <li key={cat}>• {cat}: {count} sold</li>)}
                  </ul>
                </div>
                <div>
                  <div className="font-medium">Avg Order Value</div>
                  <div className="text-2xl mt-1">₦{orders.length ? Math.round(totalRevenue / orders.filter(o => o.paymentStatus==='verified').length || 1).toLocaleString() : '0'}</div>
                  <div className="text-xs text-[#888]">Based on verified orders</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  const csv = 'ref,customer,total,status\n' + orders.map(o => `${o.reference},${o.customer.name},${o.total},${o.status}`).join('\n');
                  const blob = new Blob([csv], {type:'text/csv'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href=url; a.download='orders.csv'; a.click();
                  toast.success('Exported orders CSV');
                }}
                className="mt-4 text-xs px-3 py-1 border"
              >
                Export Orders as CSV (for your accountant)
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS - with photo upload! */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Items ({products.length})</h2>
              <button onClick={startNewProduct} className="px-4 py-2 bg-black text-white text-sm">+ Add New Item</button>
            </div>

            {/* Product Form (Add/Edit) */}
            {editingProduct && (
              <div className="bg-[#111] border border-[#222] p-6 mb-6">
                <h3 className="font-medium mb-4">{editingProduct.id ? 'Edit Item' : 'Add New Thrift Item'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Item name (e.g. Levi's 501 Jeans)" 
                    value={editingProduct.name || ''} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                    className="border p-2" 
                  />
                  <input 
                    type="number" 
                    placeholder="Price in NGN" 
                    value={editingProduct.price || ''} 
                    onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} 
                    className="border p-2" 
                  />
                  <input 
                    placeholder="Original Brand (optional)" 
                    value={editingProduct.originalBrand || ''} 
                    onChange={e => setEditingProduct({...editingProduct, originalBrand: e.target.value})} 
                    className="border p-2" 
                  />
                  <input 
                    placeholder="Size (e.g. M, 32, 42)" 
                    value={editingProduct.size || ''} 
                    onChange={e => setEditingProduct({...editingProduct, size: e.target.value})} 
                    className="border p-2" 
                  />
                  <select value={editingProduct.condition || 'Good'} onChange={e => setEditingProduct({...editingProduct, condition: e.target.value as any})} className="border p-2">
                    <option>Excellent</option><option>Good</option><option>Fair</option>
                  </select>
                  <select value={editingProduct.gender || 'Unisex'} onChange={e => setEditingProduct({...editingProduct, gender: e.target.value as any})} className="border p-2">
                    <option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option>
                  </select>
                  <select value={editingProduct.category || 'Tops'} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})} className="border p-2">
                    <option>Tops</option><option>Bottoms</option><option>Dresses</option><option>Outerwear</option><option>Footwear</option><option>Accessories</option>
                  </select>
                  <input 
                    placeholder="Measurements (optional)" 
                    value={editingProduct.measurements || ''} 
                    onChange={e => setEditingProduct({...editingProduct, measurements: e.target.value})} 
                    className="border p-2" 
                  />
                  <input 
                    type="number" 
                    placeholder="Quantity available (default 1 for unique thrift)" 
                    value={editingProduct.quantity ?? 1} 
                    onChange={e => setEditingProduct({...editingProduct, quantity: Number(e.target.value)})} 
                    className="border p-2" 
                  />
                  <label className="flex items-center gap-2 text-sm border p-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!editingProduct.featured} 
                      onChange={e => setEditingProduct({...editingProduct, featured: e.target.checked})} 
                    />
                    Featured on homepage
                  </label>
                </div>

                <textarea 
                  placeholder="Description / condition notes" 
                  value={editingProduct.description || ''} 
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  className="border p-2 w-full mt-4" rows={3} 
                />

                {/* Photo Upload - KEY FEATURE with drag & drop */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Photos (upload multiple - drag & drop supported)</label>
                  <div 
                    className="border-2 border-dashed border-[#444] p-4 text-center text-sm mb-2 hover:bg-[#1a1a1a]"
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      if (files.length) {
                        // reuse the handler logic
                        const dt = new DataTransfer();
                        files.forEach(f => dt.items.add(f));
                        const fakeEvent = { target: { files: dt.files } } as any;
                        handleProductImages(fakeEvent);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    Drop photos here or 
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleProductImages} 
                      className="ml-1" 
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {productImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 border group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeProductImage(idx)} 
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full opacity-80 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        {idx > 0 && <button onClick={() => {
                          const imgs = [...productImages];
                          [imgs[idx-1], imgs[idx]] = [imgs[idx], imgs[idx-1]];
                          setProductImages(imgs);
                        }} className="absolute bottom-0 left-0 bg-[#222] text-[8px] px-0.5 border border-[#444]">↑</button>}
                        {idx < productImages.length-1 && <button onClick={() => {
                          const imgs = [...productImages];
                          [imgs[idx], imgs[idx+1]] = [imgs[idx+1], imgs[idx]];
                          setProductImages(imgs);
                        }} className="absolute bottom-0 right-0 bg-[#222] text-[8px] px-0.5 border border-[#444]">↓</button>}
                        {idx === 0 && <div className="absolute bottom-0 left-0 bg-black text-white text-[8px] px-1">PRIMARY</div>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#888] mt-1">First photo is primary. Use drag & drop or click to add. Stored in browser for this demo.</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={saveProduct} className="bg-black text-white px-6 py-2 text-sm">Save Item</button>
                  <button onClick={cancelEdit} className="border px-6 py-2 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-[#111] border border-[#222] p-4">
                  <div className="aspect-[4/3] bg-[#222] mb-3 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full text-xs text-[#666]">No photo</div>}
                  </div>
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-[#888]">{product.originalBrand} • {product.size} • {product.condition}</div>
                  <div className="font-mono mt-1">₦{product.price.toLocaleString()} {product.quantity ? `• Qty: ${product.quantity}` : ''}</div>
                  {product.featured && <span className="text-[10px] bg-yellow-100 px-1">FEATURED</span>}
                  
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => editProduct(product)} className="text-xs px-3 py-1 border">Edit</button>
                    <button onClick={() => deleteProduct(product.id)} className="text-xs px-3 py-1 border text-red-600">Delete</button>
                  </div>
                  {product.images && product.images.length > 1 && (
                    <div className="text-[10px] text-[#666] mt-1">{product.images.length} photos</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS (enhanced) */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
              <div className="text-sm text-emerald-400 flex items-center gap-2">
                {orders.filter((o: any) => o.discountCode).length} used discount code
                <button 
                  onClick={() => {
                    const discounted = orders.filter((o: any) => o.discountCode);
                    if (discounted.length > 0) {
                      toast.info(`${discounted.length} orders used a discount code. Look for the green "Discount used" line below.`);
                    } else {
                      toast('No discounted orders yet.');
                    }
                  }} 
                  className="text-[10px] px-2 py-0.5 border border-emerald-800 hover:bg-emerald-900/20"
                >
                  Show me
                </button>
              </div>
              <button 
                onClick={() => {
                  // Seed demo if empty
                  if (orders.length === 0) {
                    (async () => {
                      const defaults = await getProducts();
                      const levi = defaults.find((p: any) => p.id === 'p1') || defaults[0];
                      const nike = defaults.find((p: any) => p.id === 'p5') || defaults[1];
                      const sample = [
                        {
                          id: 'demo1', reference: 'ZT-DEMO1',
                          items: [{ ...(levi || defaults[0]), quantity: 1 }, { ...(nike || defaults[1]), quantity: 1 }],
                          total: 25200,
                          customer: { name: 'Chinedu Okafor', phone: '2348031234567', address: '15 Adeniran Ogunsanya Street, Surulere', city: 'Lagos', notes: 'Call on arrival' },
                          paymentMethod: 'moniepoint' as const, paymentStatus: 'pending' as const, status: 'pending' as const,
                          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                          discountCode: 'THRIFT10',
                          discountAmount: 2800,
                          deliveryFee: 2000,
                          deliveryNotes: 'Mainland - standard rate',
                          trackingNumber: 'TRK-LAG-78421',
                        }
                      ];
                      setOrders(sample);
                      localStorage.setItem('zarathrift_orders', JSON.stringify(sample));
                      toast.success('Demo order loaded');
                    })();
                  }
                }} 
                className="text-xs px-3 py-1 border"
              >
                Load Demo Order
              </button>
            </div>

            {/* Prominent callout for customer cancel/refund requests */}
            {orders.filter((o: any) => o.cancelRequest?.adminStatus === 'pending').length > 0 && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-sm flex items-center justify-between">
                <div className="text-red-400 font-medium">
                  {orders.filter((o: any) => o.cancelRequest?.adminStatus === 'pending').length} customer cancel/refund request(s) pending your confirmation
                </div>
                <button 
                  onClick={() => {
                    const pending = orders.filter((o: any) => o.cancelRequest?.adminStatus === 'pending');
                    if (pending.length) {
                      toast.info(`Look for the red "CANCEL/REFUND REQUEST PENDING" boxes in the list below. Use Confirm to cancel the order or Reject.`);
                    }
                  }}
                  className="text-[10px] px-3 py-1 border border-red-700 text-red-300 hover:bg-red-900/30"
                >
                  Show me
                </button>
              </div>
            )}

            {/* === DELIVERY FLEET MANAGEMENT (Admin creates bikes here) === */}
            <div className="mb-6 p-4 bg-[#111] border border-[#333]">
              <div className="font-medium mb-3 flex items-center gap-2">🚲 YOUR DELIVERY FLEET — Create & Manage Bikes</div>
              
              {/* Add new bike form */}
              <div className="flex flex-wrap gap-2 mb-3">
                <input 
                  placeholder="Rider name (e.g. Chinedu)" 
                  value={newBikeRider} 
                  onChange={(e) => setNewBikeRider(e.target.value)} 
                  className="border px-3 py-1 text-sm bg-[#0a0a0a]" 
                />
                <input 
                  placeholder="Bike number (e.g. NG-LOG-101)" 
                  value={newBikeNumber} 
                  onChange={(e) => setNewBikeNumber(e.target.value)} 
                  className="border px-3 py-1 text-sm bg-[#0a0a0a] font-mono" 
                />
                <button 
                  onClick={addNewBike} 
                  className="px-4 py-1 bg-white text-[#0a0a0a] text-sm font-medium"
                >
                  ADD BIKE
                </button>
              </div>

              {/* Current fleet list */}
              {bikes.length === 0 ? (
                <p className="text-xs text-[#666]">No bikes yet. Add your logistic bikes above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {bikes.map((bike: any) => (
                    <div key={bike.bikeId} className="bg-[#0a0a0a] border border-[#222] p-2 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono text-emerald-400">{bike.bikeNumber}</span><br />
                        <span>{bike.riderName}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => editBike(bike.bikeId)} className="px-2 py-0.5 border text-[10px]">Edit</button>
                        <button onClick={() => deleteBike(bike.bikeId)} className="px-2 py-0.5 border text-[10px] text-red-400 border-red-900">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#666] mt-2">Bikes you create here will appear when assigning to orders. Customers will see rider + bike number on the track page.</p>
            </div>

            {orders.length === 0 ? (
              <p className="text-[#888]">No orders yet. Customers will create them via checkout.</p>
            ) : (
              <div className="space-y-4">
                {[...orders]
                  .sort((a, b) => {
                    const aPending = a.cancelRequest?.adminStatus === 'pending' ? 1 : 0;
                    const bPending = b.cancelRequest?.adminStatus === 'pending' ? 1 : 0;
                    if (aPending !== bPending) return bPending - aPending; // pending requests first
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map(order => (
                  <div key={order.id} className="bg-[#111] border border-[#222] p-5">
                    {/* same order display as before */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-sm">{order.reference}</div>
                        {order.trackingNumber && (
                          <div className="font-mono text-xs text-emerald-400">Tracking: {order.trackingNumber}</div>
                        )}
                        {order.estimatedDelivery && (
                          <div className="text-[10px] text-emerald-400/80 mt-0.5">Est: {new Date(order.estimatedDelivery).toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</div>
                        )}
                        {order.assignedBike && (
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            🚲 {order.assignedBike.bikeNumber} ({order.assignedBike.riderName})
                            {order.currentLocation ? ` — ${order.currentLocation}` : ''}
                          </div>
                        )}
                        <div className="font-medium">{order.customer.name} • {order.customer.phone}</div>
                        <div className="text-xs text-[#888]">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">₦{order.total.toLocaleString()}</div>
                        <div className={`order-status mt-1 inline-block ${order.status === 'pending' ? 'bg-amber-900/30 text-amber-400' : order.status === 'accepted' ? 'bg-blue-900/30 text-blue-400' : order.status === 'shipped' ? 'bg-purple-900/30 text-purple-400' : order.status === 'delivered' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-[#222]'}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm">Delivery: {order.customer.address}, {order.customer.city}{order.customer.state ? `, ${order.customer.state}` : ''}</div>

                    {order.discountCode && (
                      <div className="mt-1 text-xs text-emerald-400 font-medium">
                        Discount used: {order.discountCode} (−₦{(order.discountAmount || 0).toLocaleString()})
                      </div>
                    )}
                    
                    {/* Cancel/Refund Request from customer */}
                    {order.cancelRequest && order.cancelRequest.adminStatus === 'pending' && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-800 text-xs">
                        <div className="font-medium text-red-400">
                          {order.cancelRequest.type.toUpperCase()} REQUEST PENDING
                        </div>
                        <div>Requested: {new Date(order.cancelRequest.requestedAt).toLocaleString()}</div>
                        {order.cancelRequest.reason && <div>Reason: {order.cancelRequest.reason}</div>}
                        <div className="mt-1 flex gap-2">
                          <button 
                            onClick={() => approveCancelRequest(order.id)} 
                            className="px-2 py-0.5 bg-red-600 text-white text-[10px]"
                          >
                            Confirm {order.cancelRequest.type} &amp; Cancel Order
                          </button>
                          <button 
                            onClick={() => rejectCancelRequest(order.id)} 
                            className="px-2 py-0.5 border text-[10px]"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Delivery Fee + Tracking Number for Lagos */}
                    <div className="mt-2 p-2 bg-[#1a1a1a] border border-[#333] text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Delivery Fee (Lagos):</span>
                        <input 
                          type="number" 
                          value={order.deliveryFee ?? ''} 
                          onChange={(e) => {
                            const fee = Number(e.target.value) || 0;
                            const updated = orders.map(o => o.id === order.id ? {...o, deliveryFee: fee, deliveryNotes: o.deliveryNotes || 'Manually set by admin'} : o);
                            setOrders(updated);
                            localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                          }} 
                          className="w-24 border px-2 py-0.5 text-sm" 
                          placeholder="0"
                        />
                        <button 
                          onClick={() => {
                            const fee = calculateLagosDelivery(order, settings);
                            const updated = orders.map(o => o.id === order.id ? {...o, deliveryFee: fee, deliveryNotes: 'Auto-calculated by admin (Lagos rules)'} : o);
                            setOrders(updated);
                            localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                            toast.success('Delivery fee calculated');
                          }} 
                          className="px-2 py-0.5 border text-[10px]"
                        >
                          Auto-calc for Lagos
                        </button>
                      </div>

                      {/* Tracking Number - auto generates ZARA + 10 digits on ship */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-medium">Tracking #:</span>
                        <input 
                          type="text" 
                          value={order.trackingNumber || ''} 
                          onChange={(e) => {
                            const tn = e.target.value.trim();
                            const updated = orders.map(o => o.id === order.id ? {...o, trackingNumber: tn || undefined} : o);
                            setOrders(updated);
                            localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                          }} 
                          className="flex-1 border px-2 py-0.5 text-sm" 
                          placeholder="ZARA + 10 digits (auto on ship)"
                        />
                        <button 
                          onClick={() => {
                            const tn = generateTrackingNumber();
                            const updated = orders.map(o => o.id === order.id ? {...o, trackingNumber: tn} : o);
                            setOrders(updated);
                            localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                            toast.success('Tracking number generated');
                          }} 
                          className="px-2 py-0.5 border text-[10px] whitespace-nowrap"
                        >
                          Generate
                        </button>
                      </div>

                      {/* Estimated delivery - shown to customer on track page */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="font-medium">Est. delivery:</span>
                        <input 
                          type="date" 
                          value={order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const iso = val ? new Date(val + 'T00:00:00').toISOString() : undefined;
                            const updated = orders.map(o => o.id === order.id ? {...o, estimatedDelivery: iso} : o);
                            setOrders(updated);
                            localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                          }} 
                          className="border px-2 py-0.5 text-sm bg-[#111]" 
                        />
                        {order.estimatedDelivery && (
                          <button 
                            onClick={() => {
                              const updated = orders.map(o => o.id === order.id ? {...o, estimatedDelivery: undefined} : o);
                              setOrders(updated);
                              localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                            }} 
                            className="text-[10px] text-red-400"
                          >
                            clear
                          </button>
                        )}
                      </div>

                      {/* === LOGISTIC BIKE (your delivery fleet) === */}
                      <div className="mt-3 pt-2 border-t border-[#444] text-xs">
                        <div className="font-medium mb-1 flex items-center gap-2">
                          🚲 LOGISTIC BIKE
                          {order.assignedBike && (
                            <span className="text-emerald-400 text-[10px]">({order.assignedBike.bikeNumber})</span>
                          )}
                        </div>

                        {order.assignedBike ? (
                          <div className="bg-[#111] p-2 border border-[#333] mb-2">
                            <div>Rider: <span className="font-medium">{order.assignedBike.riderName}</span></div>
                            <div>Bike: <span className="font-mono">{order.assignedBike.bikeNumber}</span></div>
                            {order.currentLocation && (
                              <div className="text-emerald-400 mt-1">Last seen: {order.currentLocation}</div>
                            )}

                            {/* Driver phone for automatic location reporting from driver app */}
                            <div className="mt-2">
                              <div className="text-[10px] text-[#888]">Driver Phone (for auto GPS updates):</div>
                              <input 
                                type="tel"
                                placeholder="08012345678"
                                value={order.driverPhone || ''}
                                onChange={(e) => {
                                  const phone = e.target.value.trim();
                                  const updated = orders.map(o => o.id === order.id ? {...o, driverPhone: phone || undefined} : o);
                                  setOrders(updated);
                                  localStorage.setItem('zarathrift_orders', JSON.stringify(updated));
                                }}
                                className="w-full border px-2 py-0.5 text-xs bg-[#0a0a0a] mt-0.5"
                              />
                              <div className="text-[9px] text-[#666]">The driver will log in with this phone in their app to auto-update this order.</div>
                              <div className="text-[9px] text-amber-400 mt-1 italic">💡 Tip: Enter the driver's exact phone here. They log into "Driver Mode" in the mobile app with that number and start live GPS tracking — their real location will automatically appear on the customer's track page and in admin (no manual "Add movement" needed).</div>
                            </div>
                            {order.deliveryUpdates && order.deliveryUpdates.length > 0 && (
                              <div className="text-[10px] text-[#888] mt-1">
                                {order.deliveryUpdates.length} movement update(s)
                              </div>
                            )}

                            {/* Nice inline form for adding real GPS movements (no more ugly prompts) */}
                            <div className="mt-2 pt-2 border-t border-[#333] space-y-1.5">
                              <input
                                type="text"
                                placeholder="Current location (e.g. 'Yaba roundabout, heading north')"
                                value={movementForm[order.id]?.location || ''}
                                onChange={(e) => updateMovementInput(order.id, 'location', e.target.value)}
                                className="w-full border px-2 py-1 text-xs bg-[#0a0a0a] placeholder-[#555]"
                              />
                              <input
                                type="text"
                                placeholder="Optional note (e.g. 'Heavy traffic, 8 min delay')"
                                value={movementForm[order.id]?.note || ''}
                                onChange={(e) => updateMovementInput(order.id, 'note', e.target.value)}
                                className="w-full border px-2 py-1 text-xs bg-[#0a0a0a] placeholder-[#555]"
                              />

                              <div className="flex gap-2">
                                <button
                                  onClick={() => captureCurrentGPS(order.id)}
                                  className="flex-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] hover:bg-blue-700"
                                  title="Uses your device's real GPS (works on phone or laptop with location enabled)"
                                >
                                  📍 Use My Current GPS Location
                                </button>
                                <button
                                  onClick={() => submitInlineMovement(order.id)}
                                  disabled={!movementForm[order.id]?.location?.trim()}
                                  className="px-3 py-0.5 bg-emerald-600 text-white text-[10px] disabled:opacity-50"
                                >
                                  Add to Route
                                </button>
                              </div>

                              {movementForm[order.id]?.lat != null && movementForm[order.id]?.lng != null && (
                                <div className="text-[10px] text-emerald-400 font-mono">
                                  GPS: {movementForm[order.id]!.lat!.toFixed(6)}, {movementForm[order.id]!.lng!.toFixed(6)}
                                </div>
                              )}

                              <button 
                                onClick={() => clearBikeAssignment(order.id)} 
                                className="text-[10px] text-red-400 underline mt-1"
                              >
                                Remove bike assignment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {bikes.length > 0 ? bikes.map((bike: any) => (
                              <button 
                                key={bike.bikeId}
                                onClick={() => assignBikeToOrder(order.id, bike)}
                                className="px-2 py-0.5 border text-[10px] hover:bg-[#222]"
                              >
                                Assign {bike.bikeNumber} ({bike.riderName})
                              </button>
                            )) : (
                              <span className="text-[#666] text-[10px]">No bikes in fleet yet. Add below.</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-[#888] mt-1">
                        {order.discountCode ? (
                          <>Items: ₦{(order.total + (order.discountAmount || 0)).toLocaleString()} − Discount {order.discountCode}: ₦{(order.discountAmount || 0).toLocaleString()} + Delivery: ₦{(order.deliveryFee || 0).toLocaleString()} = <span className="font-medium">₦{(order.total + (order.deliveryFee || 0)).toLocaleString()}</span></>
                        ) : (
                          <>Items: ₦{order.total.toLocaleString()} + Delivery: ₦{(order.deliveryFee || 0).toLocaleString()} = <span className="font-medium">₦{(order.total + (order.deliveryFee || 0)).toLocaleString()}</span></>
                        )}
                      </div>
                      {order.deliveryNotes && !order.deliveryNotes.includes('To be confirmed') && (
                        <div className="text-[10px] italic mt-0.5 text-[#888]">Note: {order.deliveryNotes}</div>
                      )}
                    </div>

                    <div className="text-xs mt-1">Payment: <span className="font-medium">{order.paymentMethod}</span> — {order.paymentStatus}</div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {order.status === 'pending' && (
                        <button onClick={() => markAccepted(order.id)} className="px-3 py-1 bg-blue-600 text-white">ACCEPT ORDER</button>
                      )}
                      {(order.status === 'accepted' || order.status === 'pending') && (
                        <button onClick={() => markShipped(order.id)} className="px-3 py-1 bg-purple-600 text-white">MARK SHIPPED</button>
                      )}
                      {order.status === 'shipped' && (
                        <button onClick={() => markDelivered(order.id)} className="px-3 py-1 bg-emerald-600 text-white">MARK DELIVERED</button>
                      )}
                      {/* Use the inline form in the LOGISTIC BIKE section above for nice UX + real GPS */}
                      
                      {/* Manual WhatsApp update with current status */}
                      <a 
                        href={`https://wa.me/${order.customer.phone.replace(/\D/g,'')}?text=${encodeURIComponent(buildWhatsAppMessage(order, order.status))}`} 
                        target="_blank" 
                        className="px-3 py-1 border border-[#444] hover:bg-[#222]"
                      >
                        Send WhatsApp Update
                      </a>

                      {/* Quick status buttons */}
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'pending')} 
                        className="px-2 py-1 border text-[10px]"
                        disabled={order.status === 'pending'}
                      >
                        Set Pending
                      </button>

                      <button 
                        onClick={() => deleteOrder(order.id)} 
                        className="px-2 py-1 border text-[10px] text-red-400 border-red-800 hover:bg-red-900/20"
                      >
                        Delete Order
                      </button>
                    </div>

                    <details className="mt-3 text-xs">
                      <summary>Items ({order.items.length})</summary>
                      <ul className="pl-4 mt-1">
                        {order.items.map(item => <li key={item.id}>• {item.name} ×{item.quantity} — ₦{(item.price*item.quantity).toLocaleString()}</li>)}
                      </ul>
                      {order.discountCode && (
                        <div className="pl-4 mt-1 text-emerald-400">Discount: {order.discountCode} (−₦{(order.discountAmount || 0).toLocaleString()})</div>
                      )}
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-md">
            <h2 className="text-xl font-semibold mb-4">Business Settings</h2>
            <div className="bg-[#111] border border-[#222] p-6 space-y-4">
              <div>
                <label className="text-xs block mb-1">Business / Account Name</label>
                <input value={settings.accountName || ''} onChange={e => setSettings({...settings, accountName: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" />
              </div>
              <div>
                <label className="text-xs block mb-1">Moniepoint Account Number</label>
                <input value={settings.accountNumber || ''} onChange={e => setSettings({...settings, accountNumber: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full font-mono text-[#f5f5f5]" />
              </div>
              <div>
                <label className="text-xs block mb-1">Bank Name</label>
                <input value={settings.bankName || ''} onChange={e => setSettings({...settings, bankName: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" />
              </div>
              <div>
                <label className="text-xs block mb-1">WhatsApp Number (234...)</label>
                <input value={settings.whatsappNumber || ''} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" />
              </div>

              {/* Delivery Calculation for Lagos */}
              <div className="pt-3 border-t mt-2">
                <div className="text-xs font-semibold mb-2 tracking-widest">LAGOS DELIVERY RATES (Admin Controlled)</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-0.5">Mainland Fee (Surulere, Ikeja, Yaba...)</label>
                    <input type="number" value={settings.lagosMainlandFee ?? 2000} onChange={e => setSettings({...settings, lagosMainlandFee: Number(e.target.value)})} className="border p-1 w-full" />
                  </div>
                  <div>
                    <label className="block mb-0.5">Island Surcharge (VI, Ikoyi, Lekki, Ajah)</label>
                    <input type="number" value={settings.lagosIslandSurcharge ?? 1500} onChange={e => setSettings({...settings, lagosIslandSurcharge: Number(e.target.value)})} className="border p-1 w-full" />
                  </div>
                  <div>
                    <label className="block mb-0.5">Default Lagos Fee</label>
                    <input type="number" value={settings.lagosDeliveryFee ?? 2500} onChange={e => setSettings({...settings, lagosDeliveryFee: Number(e.target.value)})} className="border p-1 w-full" />
                  </div>
                  <div>
                    <label className="block mb-0.5">Free if Items ≥ (₦)</label>
                    <input type="number" value={settings.lagosFreeThreshold ?? 35000} onChange={e => setSettings({...settings, lagosFreeThreshold: Number(e.target.value)})} className="border p-1 w-full" />
                  </div>
                </div>
                <p className="text-[10px] text-[#888] mt-1">Admin can override per order below. Customers in Lagos see this logic in checkout notes.</p>
              </div>

              <button 
                onClick={() => saveSettingsForm(settings)} 
                className="mt-4 w-full bg-black text-white py-2 text-sm"
              >
                Save Settings
              </button>
              <p className="text-xs text-[#888]">These will be used in checkout payment instructions (may require page refresh on customer side for demo).</p>

              {/* Discount Codes Manager - Admin generates codes here */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium text-sm mb-2">Generate & Manage Discount Codes</h4>
                <p className="text-xs text-[#888] mb-2">Create codes like "THRIFT10". They will automatically show in the customer checkout discount field.</p>
                
                {/* Form to generate new code */}
                <div className="flex gap-2 mb-3">
                  <input 
                    value={newDiscountCode} 
                    onChange={(e) => setNewDiscountCode(e.target.value.toUpperCase())} 
                    placeholder="CODE e.g. THRIFT10" 
                    className="flex-1 bg-[#111] border border-[#333] p-2 text-sm text-[#f5f5f5]" 
                  />
                  <input 
                    type="number" 
                    value={newDiscountPercent} 
                    onChange={(e) => setNewDiscountPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))} 
                    className="w-20 bg-[#111] border border-[#333] p-2 text-sm text-[#f5f5f5]" 
                    min="1" max="100" 
                  />
                  <span className="self-center text-sm">%</span>
                  <button 
                    onClick={addDiscount} 
                    className="px-3 py-1 bg-black text-white text-sm whitespace-nowrap"
                  >
                    + Generate Code
                  </button>
                </div>

                {discounts.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-1">Active codes:</div>
                    <ul className="text-xs space-y-1">
                      {discounts.map((d: any, i: number) => (
                        <li key={i} className="flex justify-between items-center border p-1">
                          <span>{d.code} — {d.percent}% off {d.active ? '✅' : '❌'}</span>
                          <button onClick={() => toggleDiscount(d.code)} className="underline text-xs">
                            {d.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
            <div className="bg-[#111] border border-[#222] p-4 mb-4">
              <div className="flex gap-4 mb-4 text-sm">
                <input type="date" value={orderFilters.dateFrom} onChange={e => setOrderFilters({...orderFilters, dateFrom: e.target.value})} className="bg-[#111] border border-[#333] p-1 text-[#f5f5f5]" />
                <input type="date" value={orderFilters.dateTo} onChange={e => setOrderFilters({...orderFilters, dateTo: e.target.value})} className="bg-[#111] border border-[#333] p-1 text-[#f5f5f5]" />
                <select value={orderFilters.status} onChange={e => setOrderFilters({...orderFilters, status: e.target.value})} className="bg-[#111] border border-[#333] p-1 text-[#f5f5f5]">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mb-4">
                <div className="font-medium mb-2">Revenue by Category (CSS bars)</div>
                {Object.entries(categoryRevenue).length === 0 ? <p className="text-xs">No data for filter</p> : 
                  Object.entries(categoryRevenue).map(([cat, rev]: any) => (
                    <div key={cat} className="flex items-center gap-2 mb-1 text-xs">
                      <div className="w-24">{cat}</div>
                      <div className="flex-1 bg-[#333] h-4 relative">
                        <div className="bg-black h-4" style={{width: `${Math.min(100, (rev / Math.max(...Object.values(categoryRevenue) as number[])) * 100)}%`}}></div>
                      </div>
                      <div>₦{rev}</div>
                    </div>
                  ))
                }
              </div>

              <button onClick={() => {
                const csv = 'ref,customer,total,status,date\n' + filteredOrdersForReport.map(o => `${o.reference},${o.customer.name},${o.total},${o.status},${o.createdAt}`).join('\n');
                const blob = new Blob([csv], {type: 'text/csv'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'filtered-orders.csv'; a.click();
                toast.success('Filtered export done');
              }} className="text-xs px-3 py-1 border">Export Filtered to CSV</button>
            </div>
          </div>
        )}

        {/* CUSTOMERS CRM TAB */}
        {activeTab === 'customers' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Customer CRM</h2>
            <p className="text-xs mb-4">Unique buyers auto-populated from orders. Add private notes.</p>
            {customers.length === 0 ? <p className="text-[#888]">No customers yet. Place test orders.</p> : (
              <div className="space-y-3">
                {customers.map((c: any, i: number) => (
                  <div key={i} className="bg-[#111] border border-[#222] p-3 text-sm flex justify-between items-start">
                    <div>
                      <div>{c.name} ({c.phone}) - {c.ordersCount} orders</div>
                      <div className="text-xs text-[#888]">Notes: {c.notes || 'None'}</div>
                    </div>
                    <button onClick={() => setEditingCustomer(c)} className="text-xs border px-2">Edit Notes</button>
                  </div>
                ))}
              </div>
            )}

            {editingCustomer && (
              <div className="mt-4 bg-[#111] border border-[#222] p-4">
                <input value={editingCustomer.notes} onChange={e => setEditingCustomer({...editingCustomer, notes: e.target.value})} className="border p-2 w-full mb-2" placeholder="Private notes..." />
                <button onClick={() => saveCustomerNoteLocal(editingCustomer.phone, editingCustomer.name, editingCustomer.notes)} className="bg-black text-white px-4 py-1 text-sm">Save Note</button>
                <button onClick={() => setEditingCustomer(null)} className="ml-2 text-sm">Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* CONTENT MANAGEMENT */}
        {activeTab === 'content' && (
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Homepage Content</h2>
            <div className="bg-[#111] border border-[#222] p-4 space-y-4">
              <div>
                <label className="text-xs">Hero Title (HTML ok)</label>
                <textarea value={content.hero_title || ''} onChange={e => setContent({...content, hero_title: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" rows={2} />
              </div>
              <div>
                <label className="text-xs">Hero Subtitle</label>
                <input value={content.hero_subtitle || ''} onChange={e => setContent({...content, hero_subtitle: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" />
              </div>
              <div>
                <label className="text-xs">Tagline</label>
                <input value={content.tagline || ''} onChange={e => setContent({...content, tagline: e.target.value})} className="bg-[#111] border border-[#333] p-2 w-full text-[#f5f5f5]" />
              </div>
              <button onClick={() => saveContentForm(content)} className="bg-black text-white px-4 py-2 text-sm">Save & Publish to Homepage</button>
              <p className="text-xs">Refresh home page to see changes.</p>
            </div>
          </div>
        )}

        <div className="mt-8 text-[10px] text-[#666]">All changes (products, orders, settings) are saved to your browser's localStorage. For a real app, connect Supabase/Firebase for cloud persistence and real image uploads.</div>
      </div>
    </div>
  );
}
