import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { db, isSupabaseConfigured, supabase, Partner, Product, Order, SupportTicket } from '@/lib/supabase';
import { 
  ShoppingBag, Package, Settings, LogOut, Plus, Edit, Trash2, Check, X, 
  ExternalLink, Loader2, Sparkles, Phone, MapPin, Tag, CircleDollarSign, 
  Layers, Upload, ChevronRight, Eye, User, Truck, Clock, AlertCircle, RefreshCw,
  ArrowLeft, Building, Lock, Mail, Link as LinkIcon, EyeOff, Image as ImageIcon,
  HelpCircle, CheckCircle, Calendar, Info, Archive, FolderOpen
} from 'lucide-react';

export interface RealtimeNotification {
  id: string;
  customerName: string;
  totalPrice: number;
  itemCount: number;
  createdAt: Date;
}

export function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time notifications and badges
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Tabs: dashboard | products | orders | info | hours | logo | gallery
  const [activeTab, setActiveTab] = useState('dashboard');
  const activeTabRef = React.useRef('dashboard');

  // Orders sub-tabs: active | archived | all
  const [ordersSubTab, setOrdersSubTab] = useState<'active' | 'archived' | 'all'>('active');

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'orders') {
      setUnreadOrdersCount(0);
    }
  }, [activeTab]);

  // 1. Initial Notification permissions and Audio warm-up
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    audioRef.current = new Audio('/sounds/new-order.mp3');

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play()
          .then(() => {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
          })
          .catch(err => {
            console.log('Audio autoplay unlock failed:', err);
          });
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 2. Helper to trigger new order notifications
  const triggerNewOrderNotification = (newOrder: Order) => {
    let count = 0;
    if (Array.isArray(newOrder.items)) {
      count = newOrder.items.reduce((acc, item: any) => acc + (item.quantity || 1), 0);
    } else if (newOrder.items) {
      try {
        const itemsArr = typeof newOrder.items === 'string' ? JSON.parse(newOrder.items) : newOrder.items;
        if (Array.isArray(itemsArr)) {
          count = itemsArr.reduce((acc, item: any) => acc + (item.quantity || 1), 0);
        }
      } catch (e) {
        count = 1;
      }
    } else {
      count = 1;
    }

    const newNotif: RealtimeNotification = {
      id: newOrder.id,
      customerName: newOrder.customer_name,
      totalPrice: newOrder.total_price,
      itemCount: count,
      createdAt: new Date()
    };

    setNotifications(prev => [newNotif, ...prev]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newOrder.id));
    }, 8000);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error('Ses çalınamadı', err);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          [0, 0.15].forEach((delay) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(delay === 0 ? 587.33 : 659.25, audioCtx.currentTime + delay);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
            osc.start(audioCtx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.15);
            osc.stop(audioCtx.currentTime + delay + 0.15);
          });
        } catch (synthErr) {
          console.error('Synth fallback failed:', synthErr);
        }
      });
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification('Yeni sipariş geldi', {
          body: `${newOrder.customer_name} • ${newOrder.total_price} ₺ • ${count} ürün`,
          icon: '/android-chrome-192x192.png'
        });
      } catch (e) {
        console.warn('Notification failed:', e);
      }
    }

    if (activeTabRef.current !== 'orders') {
      setUnreadOrdersCount(prev => prev + 1);
    }

    handleRefresh();
  };

  // 3. Supabase Realtime Channel
  useEffect(() => {
    if (!partner || !isSupabaseConfigured || !supabase) return;

    console.log('Setting up real-time orders channel for partner:', partner.id);

    const channel = supabase
      .channel(`partner-orders-${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `partner_id=eq.${partner.id}`
        },
        (payload) => {
          console.log('New order received via Supabase Realtime:', payload);
          if (payload.new) {
            triggerNewOrderNotification(payload.new as Order);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime channel status: ${status}`);
      });

    return () => {
      console.log('Removing real-time orders channel for partner:', partner.id);
      supabase.removeChannel(channel);
    };
  }, [partner?.id]);

  // New & Edit Product state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productActive, setProductActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Edit Store State
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeSaving, setStoreSaving] = useState(false);

  // Weekly Working Hours State (Default structure)
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({
    Pazartesi: { open: '09:00', close: '22:00', closed: false },
    Salı: { open: '09:00', close: '22:00', closed: false },
    Çarşamba: { open: '09:00', close: '22:00', closed: false },
    Perşembe: { open: '09:00', close: '22:00', closed: false },
    Cuma: { open: '09:00', close: '23:00', closed: false },
    Cumartesi: { open: '10:00', close: '23:00', closed: false },
    Pazar: { open: '10:00', close: '22:00', closed: false }
  });

  // Gallery Images Array
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

  // Support Ticket Form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Auth States: login | signup | forgot
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Auto-generate slug from business name
  useEffect(() => {
    if (authMode === 'signup') {
      const generatedSlug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(generatedSlug);
    }
  }, [businessName, authMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setResetSuccess(false);

    try {
      if (authMode === 'signup') {
        if (!email || !password || !businessName || !slug) {
          throw new Error('Lütfen tüm alanları doldurunuz.');
        }
        if (password.length < 6) {
          throw new Error('Şifre en az 6 karakter olmalıdır.');
        }
        await db.signUp(email, password, businessName, slug);
        
        // Show success / waiting message
        setAuthError('Başvurunuz başarıyla alındı! Yönetici onayı bekliyor. Onaylandığında giriş yapabilirsiniz.');
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        if (!email) {
          throw new Error('Lütfen e-posta adresinizi giriniz.');
        }
        await db.resetPassword(email);
        setResetSuccess(true);
      } else {
        // LOGIN
        if (!email || !password) {
          throw new Error('E-posta ve şifrenizi giriniz.');
        }
        await db.signIn(email, password);
        await initDashboard();
        setLocation('/partner/dashboard');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setAuthLoading(false);
    }
  };

  const initDashboard = async () => {
    try {
      setLoading(true);
      const user = await db.getCurrentUser();
      if (!user) {
        setPartner(null);
        return;
      }

      // Fetch partner data
      const partnerData = await db.getPartnerById(user.id);
      if (partnerData) {
        setPartner(partnerData);
        setStoreName(partnerData.business_name || '');
        setStoreDesc(partnerData.description || '');
        setStorePhone(partnerData.phone || '');
        setStoreAddress(partnerData.address || '');
        setStoreCategory(partnerData.category || 'Cafe');
        setStoreLogo(partnerData.logo || '');
        
        // Load working hours if exist
        if (partnerData.working_hours) {
          try {
            const parsed = typeof partnerData.working_hours === 'string' 
              ? JSON.parse(partnerData.working_hours) 
              : partnerData.working_hours;
            if (parsed && Object.keys(parsed).length > 0) {
              setWorkingHours(parsed);
            }
          } catch (e) {
            console.warn('Error parsing working hours:', e);
          }
        }

        // Load gallery if exists
        if (partnerData.gallery) {
          try {
            const parsed = typeof partnerData.gallery === 'string'
              ? JSON.parse(partnerData.gallery)
              : partnerData.gallery;
            if (Array.isArray(parsed)) {
              setGallery(parsed);
            }
          } catch (e) {
            console.warn('Error parsing gallery:', e);
          }
        }

        // Fetch products, orders, tickets
        const prods = await db.getProducts(partnerData.id);
        setProducts(prods);

        const ords = await db.getOrders(partnerData.id);
        setOrders(ords);
        
        // Initialize unread count based on beklemede orders
        const pendingCount = ords.filter(o => o.status === 'beklemede').length;
        setUnreadOrdersCount(pendingCount);

        const tkts = await db.getSupportTickets(partnerData.id);
        setSupportTickets(tkts);
      } else {
        setPartner(null);
      }
    } catch (err) {
      console.error('Dashboard initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDashboard();
  }, []);

  const handleRefresh = async () => {
    if (!partner) return;
    try {
      const prods = await db.getProducts(partner.id);
      setProducts(prods);
      const ords = await db.getOrders(partner.id);
      setOrders(ords);
      const tkts = await db.getSupportTickets(partner.id);
      setSupportTickets(tkts);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const handleLogout = async () => {
    await db.signOut();
    setPartner(null);
    setActiveTab('dashboard');
  };

  // --- ORDER STATUS UPDATES ---
  const handleOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await db.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handleOrderArchive = async (orderId: string, archived: boolean) => {
    try {
      const updated = await db.updateOrderArchived(orderId, archived);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, archived: updated.archived } : o));
    } catch (err) {
      console.error('Error updating order archived status:', err);
    }
  };

  // --- PRODUCT MANAGEMENT ---
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductTitle('');
    setProductDesc('');
    setProductPrice('');
    setProductStock('');
    setProductImage('');
    setProductActive(true);
    setShowProductModal(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductTitle(prod.title);
    setProductDesc(prod.description || '');
    setProductPrice(String(prod.price));
    setProductStock(prod.stock !== undefined ? String(prod.stock) : '');
    setProductImage(prod.image || '');
    setProductActive(prod.active);
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await db.uploadImage(file, 'products');
      setProductImage(url);
    } catch (err) {
      console.error('Error uploading product image:', err);
      alert('Görsel yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    setSaveLoading(true);
    try {
      const payload = {
        partner_id: partner.id,
        title: productTitle,
        description: productDesc,
        price: parseFloat(productPrice) || 0,
        stock: productStock ? parseInt(productStock, 10) : undefined,
        image: productImage || undefined,
        active: productActive
      };

      if (editingProduct) {
        const updated = await db.updateProduct(editingProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await db.createProduct(payload);
        setProducts(prev => [created, ...prev]);
      }
      setShowProductModal(false);
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Ürün kaydedilemedi.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü kalıcı olarak silmek istediğinize emin misiniz?')) return;

    try {
      await db.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // --- SAVE BUSINESS INFO ---
  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    setStoreSaving(true);
    try {
      const updated = await db.updatePartner(partner.id, {
        business_name: storeName,
        description: storeDesc,
        phone: storePhone,
        address: storeAddress,
        category: storeCategory
      });
      setPartner(updated);
      alert('İşletme bilgileri başarıyla güncellendi!');
    } catch (err) {
      console.error('Error saving store details:', err);
      alert('Bilgiler kaydedilemedi.');
    } finally {
      setStoreSaving(false);
    }
  };

  // --- SAVE WORKING HOURS ---
  const handleSaveWorkingHours = async () => {
    if (!partner) return;
    setStoreSaving(true);
    try {
      const updated = await db.updatePartner(partner.id, {
        working_hours: workingHours
      });
      setPartner(updated);
      alert('Çalışma saatleriniz başarıyla kaydedildi!');
    } catch (err) {
      console.error('Error saving working hours:', err);
      alert('Çalışma saatleri kaydedilemedi.');
    } finally {
      setStoreSaving(false);
    }
  };

  // --- SAVE LOGO ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partner) return;

    setStoreSaving(true);
    try {
      const url = await db.uploadImage(file, 'logos');
      setStoreLogo(url);
      const updated = await db.updatePartner(partner.id, { logo: url });
      setPartner(updated);
      alert('Mağaza logosu başarıyla güncellendi!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Logo yüklenemedi.');
    } finally {
      setStoreSaving(false);
    }
  };

  // --- GALLERY ACTIONS ---
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partner) return;

    setUploadingGalleryImage(true);
    try {
      const url = await db.uploadImage(file, 'products');
      const updatedGallery = [...gallery, url];
      setGallery(updatedGallery);
      
      const updated = await db.updatePartner(partner.id, { gallery: updatedGallery });
      setPartner(updated);
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      alert('Görsel yüklenemedi.');
    } finally {
      setUploadingGalleryImage(false);
    }
  };

  const handleRemoveGalleryImage = async (urlToRemove: string) => {
    if (!partner) return;
    try {
      const updatedGallery = gallery.filter(url => url !== urlToRemove);
      setGallery(updatedGallery);
      
      const updated = await db.updatePartner(partner.id, { gallery: updatedGallery });
      setPartner(updated);
    } catch (err) {
      console.error('Error removing gallery image:', err);
    }
  };

  // --- SUPPORT TICKET SUBMISSION ---
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    setTicketSubmitting(true);
    setTicketSuccess(false);
    try {
      const ticket = await db.createSupportTicket({
        partner_id: partner.id,
        subject: ticketSubject,
        message: ticketMessage
      });
      setSupportTickets(prev => [ticket, ...prev]);
      setTicketSubject('');
      setTicketMessage('');
      setTicketSuccess(true);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      alert('Tepki verilemedi. Lütfen alanları kontrol ediniz.');
    } finally {
      setTicketSubmitting(false);
    }
  };


  if (loading && partner === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-foreground flex items-center justify-center font-sans antialiased">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">UĞRA Partner yükleniyor...</p>
        </div>
      </div>
    );
  }

  // --- RENDER LOGIN/SIGNUP/FORGOT FORMS ---
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col justify-between p-4 md:p-8 font-sans antialiased">
        {/* Navigation / Header */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group bg-transparent border-0">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Ana Sayfa</span>
            </button>
          </Link>

          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-muted-foreground font-medium">
              {isSupabaseConfigured ? 'Supabase Bulutu' : 'Demo Veritabanı'}
            </span>
          </div>
        </div>

        {/* Guard Forms Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
            
            <div className="text-center mb-8">
              <div className="font-sans font-extrabold tracking-wider text-4xl text-foreground select-none mb-2">
                UĞRA<span className="text-primary">.</span>
                <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full uppercase ml-1.5 font-bold tracking-normal align-middle">Partner</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {authMode === 'login' && 'Mağazanızı yönetmek ve siparişleri takip etmek için giriş yapın.'}
                {authMode === 'signup' && 'UĞRA ağına katılmak için hemen partner başvurusu oluşturun.'}
                {authMode === 'forgot' && 'Parolanızı sıfırlamak için e-posta adresinizi giriniz.'}
              </p>
            </div>

            {authError && (
              <div className="bg-primary/5 border border-primary/20 text-foreground text-xs rounded-xl p-3.5 mb-6 flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3.5 mb-6 flex items-start gap-2.5 leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {authMode === 'signup' && (
                <>
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İşletme / Mağaza Adı</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="Örn: Arkaplan Cafe"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Mağaza Linki</span>
                      <span className="text-[10px] text-primary lowercase font-mono">ugra.app/{slug || 'link'}</span>
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="arkaplan-cafe"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Address (Needed in all modes) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-Posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                  <input
                    type="email"
                    placeholder="partner@ugra.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              </div>

              {/* Password (Only needed in login/signup) */}
              {authMode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Şifre</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError(null);
                        }}
                        className="text-xs text-primary hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Şifremi Unuttum?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-11 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm mt-6 shadow-lg shadow-primary/15"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : authMode === 'signup' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Kayıt Başvurusu Yap
                  </>
                ) : authMode === 'forgot' ? (
                  'Şifre Sıfırlama Kodu Gönder'
                ) : (
                  'İşletme Girişi Yap'
                )}
              </button>
            </form>

            {/* Form Toggle Links */}
            <div className="text-center mt-6 text-sm space-y-2">
              <div>
                {authMode === 'login' ? (
                  <>
                    <span className="text-muted-foreground">UĞRA Partner'a katılmak ister misiniz?</span>{' '}
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError(null);
                      }}
                      className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0"
                    >
                      Hemen Başvur
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Giriş yapmaya geri dönmek için:</span>{' '}
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                      className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-0"
                    >
                      Giriş Yap
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/50 py-4">
          © 2026 UĞRA Teknolojileri A.Ş. Tüm hakları saklıdır.
        </div>
      </div>
    );
  }


  // --- AUTHENTICATED PARTNER DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground font-sans flex flex-col md:flex-row antialiased">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <Link href="/">
              <div className="font-sans font-extrabold tracking-wider text-2xl text-foreground select-none cursor-pointer">
                UĞRA<span className="text-primary">.</span>
                <span className="text-[10px] text-muted-foreground ml-1.5 uppercase font-normal tracking-widest">Partner</span>
              </div>
            </Link>
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Business Summary Card */}
          {partner && (
            <div className="p-4 mx-3 my-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden flex items-center justify-center text-primary text-lg font-bold">
                {partner.logo ? (
                  <img referrerPolicy="no-referrer" src={partner.logo} alt={partner.business_name} className="w-full h-full object-cover" />
                ) : (
                  partner.business_name.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold truncate text-foreground">{partner.business_name}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ugra.app/{partner.slug}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'products', label: 'Ürünler', icon: Package },
              { id: 'orders', label: 'Siparişler', icon: ShoppingBag, badge: unreadOrdersCount },
              { id: 'info', label: 'İşletme Bilgileri', icon: Settings },
              { id: 'hours', label: 'Çalışma Saatleri', icon: Clock },
              { id: 'logo', label: 'Logo', icon: User },
              { id: 'gallery', label: 'Galeri', icon: ImageIcon }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'orders') {
                      setUnreadOrdersCount(0);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-0 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/15' 
                      : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-primary-foreground text-primary' : 'bg-primary/20 text-primary'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-xl transition-all cursor-pointer border-0 bg-transparent"
          >
            <LogOut className="w-4.5 h-4.5" />
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Header bar */}
        {partner && (
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                {partner.business_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                Sistem yönetim paneli. Mağaza bilgilerinizi ve sipariş durumlarınızı canlı olarak güncelleyebilirsiniz.
              </p>
            </div>

            <a 
              href={`/${partner.slug}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-foreground font-semibold text-sm rounded-xl transition-all cursor-pointer"
            >
              <span>Canlı Mağazanı Gör</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </a>
          </header>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Toplam Gelir</p>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1.5">
                  {orders.filter(o => o.status === 'tamamlandi').reduce((acc, curr) => acc + curr.total_price, 0).toLocaleString('tr-TR')} ₺
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Tamamlanan siparişlerin toplam cirosu</p>
              </div>

              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aktif Siparişler</p>
                <h3 className="text-2xl md:text-3xl font-black text-amber-500 mt-1.5">
                  {orders.filter(o => o.status !== 'tamamlandi' && o.status !== 'iptal').length}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Hazırlanan veya yolda olan siparişler</p>
              </div>

              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Yayındaki Ürünlerim</p>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1.5">
                  {products.filter(p => p.active).length} / {products.length}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">Menünüzde aktif listelenen ürün adedi</p>
              </div>
            </div>

            {/* Dashboard grid for Support Tickets and Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Support Tickets Submit Form (7 cols) */}
              <div className="lg:col-span-7 bg-[#111113] border border-white/5 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-lg">Platform Yönetim Desteği</h3>
                </div>

                {ticketSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3.5 flex items-center gap-2 leading-relaxed">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Destek talebiniz başarıyla merkeze iletildi! En kısa sürede geri dönüş yapılacaktır.</span>
                  </div>
                )}

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Talep Konusu</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Kurye bölge genişletme / Ödeme sorunları"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-2.5 px-4 text-sm text-foreground transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Talep Detayları / Mesaj</label>
                    <textarea
                      required
                      placeholder="Yönetici ekibe iletmek istediğiniz detaylı mesajınızı buraya yazınız..."
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-2.5 px-4 text-sm text-foreground transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketSubmitting}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 border-0"
                  >
                    {ticketSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Talep Gönder'}
                  </button>
                </form>
              </div>

              {/* Right Column: Support Tickets List (5 cols) */}
              <div className="lg:col-span-5 bg-[#111113] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="font-extrabold text-lg">Önceki Destek Taleplerim</h3>

                {supportTickets.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <HelpCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Daha önce oluşturulmuş bir destek talebiniz bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {supportTickets.map(ticket => (
                      <div key={ticket.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-mono text-muted-foreground/50">#ID: {ticket.id.substring(0, 5)}</span>
                          {ticket.status === 'acik' && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase text-[9px]">Açık</span>}
                          {ticket.status === 'cozuldu' && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase text-[9px]">Çözüldü</span>}
                          {ticket.status === 'iptal' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold uppercase text-[9px]">İptal</span>}
                        </div>
                        <h4 className="font-semibold text-foreground">{ticket.subject}</h4>
                        <p className="text-muted-foreground line-clamp-2 italic">"{ticket.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Ürünlerim & Menü</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mağazanızda sergilenen ve müşterilerin sipariş verebileceği ürünler.</p>
              </div>
              <button 
                onClick={openAddProduct}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold py-2 px-4 rounded-xl cursor-pointer border-0"
              >
                <Plus className="w-4 h-4" /> Yeni Ürün Ekle
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-[#111113] border border-white/5 rounded-2xl">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Menünüzde henüz kayıtlı ürün bulunmuyor.</p>
                <button 
                  onClick={openAddProduct}
                  className="mt-4 bg-primary/10 text-primary border border-primary/20 text-xs font-bold py-2 px-4 rounded-xl hover:bg-primary/20 cursor-pointer"
                >
                  İlk Ürününü Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <div className="relative h-44 bg-white/[0.01]">
                      {prod.image ? (
                        <img referrerPolicy="no-referrer" src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-mono text-xs">Görsel Yok</div>
                      )}
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${prod.active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {prod.active ? 'Satışta' : 'Kapalı'}
                      </span>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-sm truncate">{prod.title}</h4>
                          <span className="font-mono font-bold text-primary text-sm">{prod.price} ₺</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 h-8 font-medium">{prod.description || 'Açıklama belirtilmemiş.'}</p>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Stok: <strong className="text-foreground">{prod.stock !== undefined ? `${prod.stock} adet` : 'Sınırsız'}</strong></span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => openEditProduct(prod)}
                            className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 text-red-400 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Gelen Siparişler</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Müşterilerinizin verdiği anlık siparişler, teslimat takibi ve arşiv yönetimi.</p>
              </div>

              {/* Sub-tabs header */}
              <div className="flex border-b border-white/5 pb-px gap-4 sm:gap-6 shrink-0">
                {[
                  { id: 'active', label: 'Aktif Siparişler' },
                  { id: 'archived', label: 'Arşiv' },
                  { id: 'all', label: 'Tümü' }
                ].map(subTab => {
                  const isActive = ordersSubTab === subTab.id;
                  let count = 0;
                  if (subTab.id === 'active') {
                    count = orders.filter(o => !o.archived && ['beklemede', 'hazirlaniyor', 'yolda'].includes(o.status)).length;
                  } else if (subTab.id === 'archived') {
                    count = orders.filter(o => o.archived).length;
                  } else {
                    count = orders.length;
                  }

                  return (
                    <button
                      key={subTab.id}
                      onClick={() => setOrdersSubTab(subTab.id as any)}
                      className={`pb-2 text-xs sm:text-sm font-semibold transition-all relative border-b-2 cursor-pointer ${
                        isActive 
                          ? 'text-primary border-primary' 
                          : 'text-muted-foreground border-transparent hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{subTab.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-primary/20 text-primary font-bold' : 'bg-white/5 text-muted-foreground'}`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const filtered = orders.filter(order => {
                const isArchived = !!order.archived;
                if (ordersSubTab === 'active') {
                  return !isArchived && ['beklemede', 'hazirlaniyor', 'yolda'].includes(order.status);
                } else if (ordersSubTab === 'archived') {
                  return isArchived;
                } else {
                  return true;
                }
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-16 bg-[#111113] border border-white/5 rounded-2xl">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {ordersSubTab === 'active' && 'Aktif sipariş bulunmuyor.'}
                      {ordersSubTab === 'archived' && 'Arşivlenmiş sipariş bulunmuyor.'}
                      {ordersSubTab === 'all' && 'Henüz hiç sipariş bulunmuyor.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map(order => (
                    <div 
                      key={order.id} 
                      className={`bg-[#111113] border border-white/5 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative transition-all ${
                        order.archived ? 'grayscale opacity-60 bg-[#141416]/50 border-white/5/50' : ''
                      }`}
                    >
                      {/* Status Badge in Top-Right */}
                      <div className="absolute top-4 right-4">
                        {order.status === 'beklemede' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">Beklemede</span>}
                        {order.status === 'hazirlaniyor' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">Hazırlanıyor</span>}
                        {order.status === 'yolda' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400">Yolda</span>}
                        {order.status === 'tamamlandi' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Tamamlandı</span>}
                        {order.status === 'iptal' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">İptal Edildi</span>}
                      </div>

                      {/* Left: Customer Info (Compact) */}
                      <div className="space-y-1.5 flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-bold text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">#{order.id.substring(0, 8)}</span>
                          <span className="text-muted-foreground/80 font-mono">{new Date(order.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{order.customer_name}</h4>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-foreground/60 shrink-0" /> {order.customer_phone}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-start gap-1 font-medium max-w-md">
                              <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" /> <span>{order.customer_address}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Order Items List (Compact) */}
                      <div className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 w-full lg:max-w-xs shrink-0">
                        <div className="text-[10px] font-bold text-muted-foreground/80 uppercase mb-1 flex justify-between items-center">
                          <span>Sipariş İçeriği</span>
                          <span className="text-[9px] lowercase text-primary bg-primary/5 px-1 py-0.5 rounded">
                            {order.payment_type === 'kapida_nakit' && 'Kapıda Nakit'}
                            {order.payment_type === 'kapida_kart' && 'Kapıda Kart'}
                            {order.payment_type === 'online' && 'Online Ödeme'}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs max-h-24 overflow-y-auto">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between font-medium">
                              <span className="truncate text-muted-foreground/90 max-w-[180px]">• {item.title}</span>
                              <span className="font-bold text-foreground font-mono">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] text-amber-500/90 font-medium leading-relaxed">
                            <strong>Not:</strong> "{order.notes}"
                          </div>
                        )}
                      </div>

                      {/* Right: Actions, Price & Dropdown (Compact) */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-72 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        <div className="lg:text-right">
                          <div className="text-[10px] text-muted-foreground">Toplam Tutar</div>
                          <div className="text-base font-black text-white font-mono mt-0.5">{order.total_price} ₺</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Select */}
                          <select
                            value={order.status}
                            disabled={order.archived}
                            onChange={(e) => handleOrderStatus(order.id, e.target.value as any)}
                            className="bg-[#18181b] border border-white/5 rounded-lg py-1.5 px-2 text-xs text-foreground outline-none focus:border-primary/40 cursor-pointer disabled:opacity-50"
                          >
                            <option value="beklemede">Beklemede</option>
                            <option value="hazirlaniyor">Hazırlanıyor</option>
                            <option value="yolda">Yolda</option>
                            <option value="tamamlandi">Tamamlandı</option>
                            <option value="iptal">İptal</option>
                          </select>

                          {/* Archive / Restore Button */}
                          {order.archived ? (
                            <button
                              onClick={() => handleOrderArchive(order.id, false)}
                              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border-0 transition-all cursor-pointer"
                              title="Arşivden Çıkar"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Geri Al</span>
                            </button>
                          ) : (
                            (order.status === 'tamamlandi' || order.status === 'iptal') && (
                              <button
                                onClick={() => handleOrderArchive(order.id, true)}
                                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-0 transition-all cursor-pointer"
                                title="Arşive Gönder"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Arşivle</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* 4. BUSINESS INFO (İşletme Bilgileri) TAB */}
        {activeTab === 'info' && (
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">İşletme Bilgileri</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Müşterilerinizin mağaza sayfanızda gördüğü genel açıklamalar ve iletişim detayları.</p>
            </div>

            <form onSubmit={handleSaveBusinessInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">İşletme Adı</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full bg-[#111113] border border-white/5 focus:border-primary/50 outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all"
                  >
                    <option value="Cafe">Cafe & Kahve</option>
                    <option value="Restoran">Restoran & Yemek</option>
                    <option value="Moda">Vintage & Moda</option>
                    <option value="Çiçekçi">Çiçekçi</option>
                    <option value="Market">Şarküteri & Market</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">İletişim Telefonu</label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="Örn: 0532..."
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mağaza Tanıtım Açıklaması</label>
                <textarea
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  placeholder="Mağazanız hakkında kısa bir tanıtım..."
                  rows={3}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">İşletme Adresi</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Adres bilgisi..."
                  rows={2.5}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={storeSaving}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 border-0"
              >
                {storeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'İşletme Bilgilerini Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* 5. WORKING HOURS (Çalışma Saatleri) TAB */}
        {activeTab === 'hours' && (
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Çalışma Saatleri</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Haftalık çalışma takviminizi belirleyin. Müşteriler kapalı saatlerde sipariş geçemezler.</p>
            </div>

            <div className="space-y-3">
              {Object.entries(workingHours).map(([day, hrs]) => (
                <div key={day} className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl text-sm gap-4">
                  <div className="font-semibold w-24 text-foreground">{day}</div>
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id={`closed-${day}`}
                      checked={hrs.closed}
                      onChange={(e) => {
                        setWorkingHours({
                          ...workingHours,
                          [day]: { ...hrs, closed: e.target.checked }
                        });
                      }}
                      className="rounded bg-white/[0.02] border border-white/10 text-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`closed-${day}`} className="text-xs text-muted-foreground uppercase cursor-pointer select-none">KAPALI</label>
                  </div>

                  {!hrs.closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="09:00"
                        value={hrs.open}
                        onChange={(e) => {
                          setWorkingHours({
                            ...workingHours,
                            [day]: { ...hrs, open: e.target.value }
                          });
                        }}
                        className="bg-white/[0.02] border border-white/5 w-16 text-center py-1.5 rounded-lg text-xs outline-none"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="text"
                        placeholder="22:00"
                        value={hrs.close}
                        onChange={(e) => {
                          setWorkingHours({
                            ...workingHours,
                            [day]: { ...hrs, close: e.target.value }
                          });
                        }}
                        className="bg-white/[0.02] border border-white/5 w-16 text-center py-1.5 rounded-lg text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveWorkingHours}
              disabled={storeSaving}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 border-0"
            >
              {storeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Çalışma Saatlerini Kaydet'}
            </button>
          </div>
        )}

        {/* 6. LOGO TAB */}
        {activeTab === 'logo' && (
          <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 max-w-md space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">İşletme Logosu</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mağaza kapağı ve marka sembolü olarak görüntülenecek kare logo yükleyin.</p>
            </div>

            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-32 h-32 bg-primary/10 border border-primary/20 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-primary text-4xl shadow-inner relative group">
                {storeLogo ? (
                  <img referrerPolicy="no-referrer" src={storeLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  partner.business_name.charAt(0)
                )}
              </div>

              <div className="space-y-2 text-center w-full">
                <label className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl text-sm cursor-pointer transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  {storeSaving ? 'Logo Yükleniyor...' : 'Yeni Logo Seç ve Yükle'}
                  <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                </label>
                <p className="text-[10px] text-muted-foreground">Kare formatında (JPEG / PNG) görseller tercih ediniz.</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Fotoğraf Galerisi</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Mağazanızı tanıtan ambiyans veya mekan fotoğraflarını yükleyin.</p>
              </div>
              
              <label className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-all">
                {uploadingGalleryImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Fotoğraf Ekle
                  </>
                )}
                <input type="file" onChange={handleGalleryUpload} className="hidden" accept="image/*" />
              </label>
            </div>

            {gallery.length === 0 ? (
              <div className="text-center py-16 bg-[#111113] border border-white/5 rounded-2xl">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Galerinizde henüz fotoğraf bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((url, index) => (
                  <div key={index} className="relative aspect-video bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden group">
                    <img referrerPolicy="no-referrer" src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    
                    <button 
                      onClick={() => handleRemoveGalleryImage(url)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-red-400 border-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Fotoğrafı Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* PRODUCT MODAL (ADD / EDIT) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-white/5 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-lg">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Image upload preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ürün Fotoğrafı</label>
                <div className="relative h-40 bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center group">
                  {productImage ? (
                    <>
                      <img referrerPolicy="no-referrer" src={productImage} alt="Product Preview" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-xs font-semibold text-white gap-1.5">
                        <Upload className="w-4 h-4" />
                        Görseli Değiştir
                        <input type="file" onChange={handleProductImageUpload} className="hidden" accept="image/*" />
                      </label>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground h-full w-full">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground/40" />
                          <span>Görsel Yüklemek İçin Tıklayın</span>
                        </>
                      )}
                      <input type="file" onChange={handleProductImageUpload} className="hidden" accept="image/*" />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ürün Adı</label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="Örn: Double Latte"
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/30"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Açıklama</label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Ürün içeriği ve detayları..."
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all h-20 resize-none placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fiyat (₺)</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="85"
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/30"
                    required
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Miktarı</label>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder="100"
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prod-active"
                  checked={productActive}
                  onChange={(e) => setProductActive(e.target.checked)}
                  className="rounded bg-white/[0.02] border border-white/10 text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="prod-active" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none">
                  Satışa Açık (Aktif)
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-foreground font-semibold rounded-xl text-sm transition-colors cursor-pointer border-0"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Order Notification Toasts */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-[#111113]/95 border-l-4 border-l-primary border border-white/5 rounded-2xl p-4 shadow-2xl flex gap-3 relative overflow-hidden backdrop-blur-md shadow-primary/10 transition-all hover:scale-[1.02] duration-200"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 0 15px rgba(242, 140, 40, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
              <ShoppingBag className="w-5 h-5" />
            </div>
            
            <div className="flex-1 pr-4">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5 leading-tight">
                Yeni Sipariş Geldi!
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {notif.customerName} • <span className="text-primary font-bold">{notif.totalPrice} ₺</span> • {notif.itemCount} ürün
              </p>
              <span className="text-[9px] text-muted-foreground/50 block mt-2 font-mono">
                {notif.createdAt.toLocaleTimeString('tr-TR')}
              </span>
            </div>

            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5 border-0 bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
