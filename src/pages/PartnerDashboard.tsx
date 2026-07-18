import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { db, isSupabaseConfigured, Partner, Product, Order } from '@/lib/supabase';
import { 
  ShoppingBag, Package, Settings, LogOut, Plus, Edit, Trash2, Check, X, 
  ExternalLink, Loader2, Sparkles, Phone, MapPin, Tag, CircleDollarSign, 
  Layers, Upload, ChevronRight, Eye, User, Truck, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

export function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'pro'>('orders');

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

  // Check auth and load data
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const user = await db.getCurrentUser();
        if (!user) {
          setLocation('/partner/login');
          return;
        }

        // Get partner data
        const partnerData = await db.getPartnerById(user.id);
        if (partnerData) {
          setPartner(partnerData);
          setStoreName(partnerData.business_name || '');
          setStoreDesc(partnerData.description || '');
          setStorePhone(partnerData.phone || '');
          setStoreAddress(partnerData.address || '');
          setStoreCategory(partnerData.category || 'Cafe');
          setStoreLogo(partnerData.logo || '');

          // Fetch products & orders
          const prods = await db.getProducts(partnerData.id);
          setProducts(prods);

          const ords = await db.getOrders(partnerData.id);
          setOrders(ords);
        } else {
          // Fallback if profiles is empty (mock mode)
          const session = await db.getSession();
          if (session) {
            setLocation('/partner/login');
          }
        }
      } catch (err) {
        console.error('Dashboard initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [setLocation]);

  const handleRefresh = async () => {
    if (!partner) return;
    try {
      const prods = await db.getProducts(partner.id);
      setProducts(prods);
      const ords = await db.getOrders(partner.id);
      setOrders(ords);
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
    }
  };

  const handleLogout = async () => {
    await db.signOut();
    setLocation('/partner/login');
  };

  // --- ORDER MANAGEMENTS ---
  const handleOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await db.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // --- PRODUCT ACTIONS ---
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
    setProductPrice(prod.price.toString());
    setProductStock(prod.stock.toString());
    setProductImage(prod.image || '');
    setProductActive(prod.active);
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await db.uploadImage(file, 'products');
      setProductImage(publicUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Resim yüklenirken hata oluştu.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStoreLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await db.uploadImage(file, 'logos');
      setStoreLogo(publicUrl);
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert('Logo yüklenirken hata oluştu.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    if (!productTitle || !productPrice) {
      alert('Lütfen en azından Ürün Adı ve Fiyat alanlarını doldurun.');
      return;
    }

    setSaveLoading(true);
    try {
      const productData = {
        partner_id: partner.id,
        title: productTitle,
        description: productDesc,
        price: parseFloat(productPrice) || 0,
        image: productImage || undefined,
        stock: parseInt(productStock) || 0,
        active: productActive
      };

      if (editingProduct) {
        const updated = await db.updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await db.createProduct(productData);
        setProducts(prev => [created, ...prev]);
      }
      setShowProductModal(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      await db.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  // --- SAVE STORE SETTINGS ---
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    setStoreSaving(true);
    try {
      const updated = await db.updatePartner(partner.id, {
        business_name: storeName,
        description: storeDesc,
        phone: storePhone,
        address: storeAddress,
        category: storeCategory,
        logo: storeLogo
      });
      setPartner(updated);
      alert('Mağaza ayarları başarıyla güncellendi!');
    } catch (err) {
      console.error('Error saving store info:', err);
    } finally {
      setStoreSaving(false);
    }
  };

  // Status badges helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'beklemede':
        return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Beklemede</span>;
      case 'hazirlaniyor':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Hazırlanıyor</span>;
      case 'yolda':
        return <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Kuryede</span>;
      case 'tamamlandi':
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">Tamamlandı</span>;
      case 'iptal':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold uppercase">İptal Edildi</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">Paneliniz yükleniyor...</p>
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'}`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4.5 h-4.5" />
                Siparişler
              </div>
              {orders.filter(o => o.status === 'beklemede').length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'orders' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                  {orders.filter(o => o.status === 'beklemede').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'}`}
            >
              <Package className="w-4.5 h-4.5" />
              Ürünlerim
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'}`}
            >
              <Settings className="w-4.5 h-4.5" />
              Mağaza Ayarları
            </button>

            <button
              onClick={() => setActiveTab('pro')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${activeTab === 'pro' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'}`}
            >
              <Sparkles className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
              Pro Özellikler
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* TOP BAR / STATS HEADER */}
        {partner && (
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Merhaba, {partner.business_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Mağaza yönetim panelinize hoş geldiniz. Sipariş durumlarını canlı güncelleyebilirsiniz.
              </p>
            </div>

            {/* Actions / View Store Button */}
            <a 
              href={`/${partner.slug}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-foreground font-semibold text-sm rounded-xl transition-all"
            >
              Mağazanı Gör
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </header>
        )}

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bugünkü Kazanç</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
                  {orders.filter(o => o.status === 'tamamlandi').reduce((acc, curr) => acc + curr.total_price, 0).toLocaleString('tr-TR')} ₺
                </h3>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bekleyen Siparişler</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-yellow-500 mt-1">
                  {orders.filter(o => o.status === 'beklemede').length}
                </h3>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktif Hazırlanan</p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-blue-400 mt-1">
                  {orders.filter(o => o.status === 'hazirlaniyor' || o.status === 'yolda').length}
                </h3>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Canlı Sipariş Takibi
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>

              {orders.length === 0 ? (
                <div className="bg-[#111113] border border-white/5 rounded-3xl p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4 animate-bounce" />
                  <p className="text-muted-foreground text-sm font-medium">Henüz sipariş almadınız.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Sipariş alındığında burada canlı olarak görünecektir.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div>
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                          <div>
                            <h4 className="font-semibold text-white text-base">{order.customer_name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              {order.customer_phone}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        {/* Order Address */}
                        <div className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{order.customer_address}</span>
                        </div>

                        {/* Order Items */}
                        <div className="mt-4 bg-white/[0.01] rounded-xl p-3 border border-white/5 space-y-2">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                <strong className="text-foreground">{item.quantity}x</strong> {item.title}
                              </span>
                              <span>{item.price} ₺</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2 text-sm text-white font-bold">
                            <span>Ödeme: {order.payment_type === 'kapida_kart' ? 'Kapıda Kredi Kartı' : 'Kapıda Nakit'}</span>
                            <span className="text-primary text-base">{order.total_price} ₺</span>
                          </div>
                        </div>
                      </div>

                      {/* Change Status Controls */}
                      <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-2 justify-end">
                        <span className="text-xs font-semibold text-muted-foreground mr-auto">Durumu Güncelle:</span>
                        {order.status === 'beklemede' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'hazirlaniyor')}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Hazırla
                          </button>
                        )}
                        {order.status === 'hazirlaniyor' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'yolda')}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Kuryeye Ver
                          </button>
                        )}
                        {order.status === 'yolda' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'tamamlandi')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Tamamlandı
                          </button>
                        )}
                        {order.status !== 'tamamlandi' && order.status !== 'iptal' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'iptal')}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            İptal Et
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Kayıtlı Ürünler ({products.length})</h3>
              <button
                onClick={openAddProduct}
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Yeni Ürün Ekle
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-[#111113] border border-white/5 rounded-3xl p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-medium">Henüz ürün eklemediniz.</p>
                <button
                  onClick={openAddProduct}
                  className="mt-4 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  İlk Ürünü Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <div key={prod.id} className={`bg-[#111113] border ${prod.active ? 'border-white/5' : 'border-white/5 opacity-50'} rounded-2xl overflow-hidden flex flex-col justify-between`}>
                    {/* Product Image Area */}
                    <div className="relative h-44 bg-[#1E1E22] overflow-hidden flex items-center justify-center">
                      {prod.image ? (
                        <img referrerPolicy="no-referrer" src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-muted-foreground/20" />
                      )}
                      
                      {/* Active/Passive Tag */}
                      <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${prod.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                        {prod.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-white text-sm truncate">{prod.title}</h4>
                        <span className="text-primary font-bold text-sm whitespace-nowrap">{prod.price} ₺</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                        {prod.description || 'Açıklama girilmemiş.'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                        <Layers className="w-3 h-3 text-primary" />
                        <span>Stok: <strong>{prod.stock}</strong> adet</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-2">
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. STORE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-[#111113] border border-white/5 rounded-3xl p-6 md:p-8 max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Mağaza Profil Ayarları
            </h3>

            <form onSubmit={handleSaveStore} className="space-y-5">
              {/* Logo Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-white/5">
                <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center text-muted-foreground overflow-hidden">
                  {storeLogo ? (
                    <img referrerPolicy="no-referrer" src={storeLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <h4 className="text-sm font-semibold text-white">Mağaza Logosu</h4>
                  <p className="text-xs text-muted-foreground">Logonuz sipariş arayüzünde görünür.</p>
                  <label className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] px-3 py-1.5 rounded-lg text-xs font-bold text-foreground cursor-pointer transition-colors mt-2">
                    <Upload className="w-3.5 h-3.5" />
                    Yeni Logo Seç
                    <input type="file" onChange={handleStoreLogoUpload} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İşletme Adı</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kısa Açıklama</label>
                <textarea
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İletişim Telefonu</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</label>
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

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İşletme Adresi</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-sm text-foreground transition-all h-20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={storeSaving}
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
              >
                {storeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ayarları Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* 4. PRO FEATURES TAB */}
        {activeTab === 'pro' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-[#1E1B10]/20 border border-yellow-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 rounded-2xl bg-yellow-500/10 text-yellow-500 shrink-0">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-400">UĞRA Pro Partner Programı</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  İşletmenizi bir üst kademeye taşıyacak entegre kampanya modülleri, dijital kurye entegrasyonu, ve online ödeme sistemleri çok yakında aktifleştirilecektir. Altyapımız bu özelliklerin tümünü ölçeklenebilir olarak desteklemektedir.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-2">
                <Truck className="w-6 h-6 text-primary" />
                <h4 className="font-semibold text-white text-sm">Gelişmiş Kurye Entegrasyonu</h4>
                <p className="text-xs text-muted-foreground">Canlı kurye konum takibi ve sipariş teslimat durum otomasyonu.</p>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-2">
                <CircleDollarSign className="w-6 h-6 text-primary" />
                <h4 className="font-semibold text-white text-sm">Online Ödeme Alma (İyzico)</h4>
                <p className="text-xs text-muted-foreground">Kredi kartıyla anında online tahsilat ve otomatik hakediş dağıtımı.</p>
              </div>
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 space-y-2">
                <Tag className="w-6 h-6 text-primary" />
                <h4 className="font-semibold text-white text-sm">Kupon & İndirim Modülü</h4>
                <p className="text-xs text-muted-foreground">Müşterilerinize özel kampanya kodları, sepet indirimleri ve özel promosyonlar.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT MODAL (ADD / EDIT) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-white/5 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-lg">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground cursor-pointer"
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
                        Değiştir
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
                  placeholder="Örn: Sıcak Latte"
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
                  className="flex-1 py-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-foreground font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
