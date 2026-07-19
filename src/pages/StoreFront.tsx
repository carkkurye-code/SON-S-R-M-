import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { db, Partner, Product, Order } from '@/lib/supabase';
import { 
  ShoppingBag, Phone, MapPin, Loader2, ShoppingCart, Check, 
  ArrowLeft, ChevronRight, CheckCircle2, ShieldAlert, CreditCard, Banknote, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CartItem {
  product: Product;
  quantity: number;
}

export function StoreFront() {
  const [, params] = useRoute('/:slug');
  const slug = params?.slug || '';

  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Cart Local State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [paymentType, setPaymentType] = useState<'kapida_nakit' | 'kapida_kart'>('kapida_kart');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      setLoading(true);
      setError(false);
      try {
        const partnerData = await db.getPartnerBySlug(slug);
        if (!partnerData) {
          setError(true);
          return;
        }
        setPartner(partnerData);

        const productsData = await db.getProducts(partnerData.id);
        setProducts(productsData.filter(p => p.active));
      } catch (err) {
        console.error('Error fetching storefront data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStoreData();
    }
  }, [slug]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || cart.length === 0) return;

    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      alert('Lütfen tüm sipariş bilgilerini eksiksiz doldurunuz.');
      return;
    }

    setOrderSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.product.id,
        name: item.product.title,
        title: item.product.title, // Consistent with mapping in PartnerDashboard.tsx
        price: item.product.price,
        quantity: item.quantity
      }));

      const newOrderData: Omit<Order, 'id' | 'created_at' | 'status'> = {
        partner_id: partner.id,
        customer_name: custName,
        customer_phone: custPhone,
        customer_address: custAddress,
        payment_type: paymentType,
        total_price: cartTotal,
        items: orderItems
      };

      await db.createOrder(newOrderData);
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error('Error placing order:', err);
      const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert('Sipariş iletilirken bir hata oluştu:\n' + errMsg);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const closeSuccessDialog = () => {
    setOrderSuccess(false);
    setIsCheckoutOpen(false);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">Mağaza yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-foreground flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm">
          <ShieldAlert className="w-16 h-16 text-primary mx-auto opacity-80" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Mağaza Bulunamadı</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aradığınız <strong>"{slug}"</strong> mağazası mevcut değil ya da şu anda aktif değil.
            </p>
          </div>
          <Link href="/">
            <button className="w-full bg-[#111113] border border-white/5 hover:bg-white/[0.05] text-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors">
              Ana Sayfaya Dön
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground font-sans antialiased pb-12">
      {/* Dynamic Header Banner / Branding */}
      <header className="border-b border-white/5 bg-[#111113]/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Store Logo */}
            <div className="w-12 h-12 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center text-primary text-xl font-extrabold shadow-md">
              {partner.logo ? (
                <img referrerPolicy="no-referrer" src={partner.logo} alt={partner.business_name} className="w-full h-full object-cover" />
              ) : (
                partner.business_name.charAt(0)
              )}
            </div>
            <div>
              <h1 className="font-bold text-white text-base md:text-lg leading-tight">{partner.business_name}</h1>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {partner.category || 'Cafe'}
              </span>
            </div>
          </div>

          <Link href="/">
            <button className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-full transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              UĞRA
            </button>
          </Link>
        </div>
      </header>

      {/* Store Cover Description */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-3 md:max-w-2xl">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Hoş Geldiniz</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {partner.description || 'Seçkin ürünlerimizle hizmetinizdeyiz. Aşağıdaki ürün listesinden dilediğinizi seçip kapıda ödeme seçeneğiyle anında sipariş verebilirsiniz.'}
            </p>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-muted-foreground/80">
              {partner.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-primary" />
                  {partner.phone}
                </span>
              )}
              {partner.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {partner.address}
                </span>
              )}
            </div>
          </div>

          {/* Secure Shopping Seal */}
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 text-center md:text-left space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">UĞRA GÜVENCESİ</span>
            <p className="text-xs text-muted-foreground">Kapıda nakit veya kartla güvenli ödeme.</p>
          </div>
        </div>
      </div>

      {/* PRODUCTS LIST GRID */}
      <section className="max-w-5xl mx-auto px-4 mt-12 space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight">Ürün Kataloğu</h3>

        {products.length === 0 ? (
          <div className="bg-[#111113] border border-white/5 rounded-3xl p-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Bu mağazada henüz ürün bulunmuyor.</h4>
            <p className="text-xs text-muted-foreground">Daha sonra tekrar kontrol edebilirsiniz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => {
              const cartItem = cart.find(item => item.product.id === prod.id);

              return (
                <div key={prod.id} className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-primary/20 transition-all duration-300">
                  {/* Product Image */}
                  <div className="relative h-56 bg-[#1A1A1C] overflow-hidden flex items-center justify-center">
                    {prod.image ? (
                      <img referrerPolicy="no-referrer" src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <ShoppingBag className="w-16 h-16 text-muted-foreground/10" />
                    )}
                    {prod.stock <= 3 && prod.stock > 0 && (
                      <span className="absolute top-3 left-3 bg-orange-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                        Son {prod.stock} Ürün!
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-white text-base truncate">{prod.title}</h4>
                        <span className="text-primary font-extrabold text-base whitespace-nowrap">{prod.price} ₺</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {prod.description || 'Bu ürün için açıklama belirtilmemiş.'}
                      </p>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center justify-between gap-2 w-full bg-white/[0.02] border border-white/10 rounded-xl p-1">
                        <button
                          onClick={() => updateCartQuantity(prod.id, cartItem.quantity - 1)}
                          className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center font-bold text-white hover:bg-white/[0.1] transition-all cursor-pointer text-sm"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-xs text-white px-2">{cartItem.quantity} Adet</span>
                        <button
                          onClick={() => updateCartQuantity(prod.id, cartItem.quantity + 1)}
                          className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center font-bold text-white hover:bg-white/[0.1] transition-all cursor-pointer text-sm"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 hover:shadow-primary/25"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Sepete Ekle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* STICKY BOTTOM CART (FOR MOBILE) & FLOATING CART (FOR DESKTOP) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto z-40 p-4 md:p-0"
          >
            <div className="bg-[#111113] border border-white/10 md:rounded-2xl shadow-2xl p-4 md:w-96 flex items-center justify-between gap-4 w-full rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111113]">
                    {cartItemCount}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sipariş Toplamı</div>
                  <div className="text-base font-extrabold text-white">{cartTotal.toLocaleString('tr-TR')} ₺</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCheckoutOpen(true);
                  setOrderSuccess(false);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase font-extrabold tracking-wider px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer border-0"
              >
                Siparişi Tamamla
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL & REDESIGNED SUCCESS DIALOG */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSuccessDialog}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Inner Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`relative z-10 w-[92%] max-w-[420px] bg-white text-[#111111] rounded-[20px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden max-h-[90vh] overflow-y-auto`}
            >
              {!orderSuccess ? (
                /* CHECKOUT FLOW FORM */
                <div className="space-y-4">
                  {/* Modal Header */}
                  <div className="text-center pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 truncate">Siparişi Tamamla</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Siparişiniz doğrudan işletmeye iletilecektir.</p>
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sepetinizdeki Ürünler</div>
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between gap-3 border border-gray-100">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 text-xs truncate">{item.product.title}</h4>
                          <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.product.price} ₺ / adet</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-xs text-gray-900 w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 text-xs cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-6 h-6 text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                            title="Ürünü Çıkar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-gray-900 whitespace-nowrap min-w-[55px] text-right shrink-0">
                          {(item.product.price * item.quantity).toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleOrderSubmit} className="space-y-3 text-left">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ad Soyad</label>
                      <input
                        type="text"
                        placeholder="Ahmet Yılmaz"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white outline-none rounded-xl py-2.5 px-3.5 text-xs text-gray-900 transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Telefon Numarası</label>
                      <input
                        type="tel"
                        placeholder="0555 123 45 67"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white outline-none rounded-xl py-2.5 px-3.5 text-xs text-gray-900 transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sipariş Adresi</label>
                      <textarea
                        placeholder="Örn: Moda Caddesi, Sevgi Apt. No:12 Daire:4 Kadıköy/İstanbul"
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-orange-500 focus:bg-white outline-none rounded-xl py-2.5 px-3.5 text-xs text-gray-900 transition-all h-16 resize-none placeholder:text-gray-400 leading-relaxed"
                        required
                      />
                    </div>

                    {/* Payment Selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kapıda Ödeme Seçeneği</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentType('kapida_kart')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${paymentType === 'kapida_kart' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Kredi Kartı
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentType('kapida_nakit')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${paymentType === 'kapida_nakit' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Nakit
                        </button>
                      </div>
                    </div>

                    {/* Total Price & Submit */}
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                        <span>Toplam Tutar:</span>
                        <span className="text-orange-500 text-lg">{cartTotal.toLocaleString('tr-TR')} ₺</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCheckoutOpen(false)}
                          className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer bg-transparent"
                        >
                          Kapat
                        </button>
                        <button
                          type="submit"
                          disabled={orderSubmitting}
                          className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-0"
                        >
                          {orderSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Siparişi İlet'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                /* BİREBİR REDESIGNED SUCCESS STAGE (ACCORDING TO USER'S GRAPHIC PLAN) */
                <div className="flex flex-col items-center justify-center text-center py-4 space-y-5">
                  {/* UĞRA. */}
                  <div className="font-sans font-extrabold tracking-wider text-3xl text-[#111111] select-none text-center">
                    UĞRA<span className="text-[#F97316]">.</span>
                  </div>

                  {/* Talebiniz Alındı */}
                  <h3 className="text-[22px] font-bold text-[#111111] tracking-tight text-center">
                    Talebiniz Alındı
                  </h3>

                  {/* Asistanımız talebinizi aldı. En kısa sürede sizinle iletişime geçecektir. */}
                  <p className="text-[15px] font-normal text-[#6B7280] leading-relaxed text-center">
                    Asistanımız talebinizi aldı.<br />
                    En kısa sürede sizinle iletişime geçecektir.
                  </p>

                  {/* DIVIDER 1 */}
                  <div className="w-full border-t border-gray-100 my-1"></div>

                  {/* Lütfen telefonunuzu açık ve ulaşılabilir durumda tutunuz. */}
                  <p className="text-[13px] font-normal text-gray-400 leading-relaxed text-center">
                    Lütfen telefonunuzu açık ve<br />
                    ulaşılabilir durumda tutunuz.
                  </p>

                  {/* DIVIDER 2 */}
                  <div className="w-full border-t border-gray-100 my-1"></div>

                  {/* Tamam Button */}
                  <button
                    onClick={closeSuccessDialog}
                    className="w-full h-[50px] bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-[16px] transition-colors duration-300 ease-out active:scale-[0.98] cursor-pointer text-base border-0"
                  >
                    Tamam
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
