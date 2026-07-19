import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Building, Users, ShoppingBag, Package, Settings, LogOut, Check, X, 
  Shield, RefreshCw, BarChart3, AlertCircle, ArrowLeft, Loader2, Sparkles, 
  Plus, Edit, Trash2, Mail, ExternalLink, HelpCircle, Eye, EyeOff, Lock,
  Phone, MapPin, Search, Calendar, Landmark, Info, ClipboardList
} from 'lucide-react';
import { db, isSupabaseConfigured, Partner, Product, Order, SupportTicket, AuditLog } from '@/lib/supabase';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

export function AdminPanel() {
  const [location, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const adminSqlScript = `-- 1. Pgcrypto eklentisini aktifleştirin
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. admin@ugra.app kullanıcısını auth.users ve public tablolarına güvenli bir şekilde ekleyin
DO $$
DECLARE
  v_user_id UUID := 'd0a0b0c0-d0e0-f0a0-b0c0-d0e0f0a0b0c0';
  v_encrypted_password TEXT;
BEGIN
  -- 'gokougra123' şifresi için bcrypt hash üret
  v_encrypted_password := extensions.crypt('gokougra123', extensions.gen_salt('bf', 10));

  -- Çakışmaları önlemek için eski kayıtları temizle
  DELETE FROM public.profiles WHERE id = v_user_id OR id IN (SELECT id FROM auth.users WHERE email = 'admin@ugra.app');
  DELETE FROM public.partners WHERE id = v_user_id OR id IN (SELECT id FROM auth.users WHERE email = 'admin@ugra.app');
  DELETE FROM auth.identities WHERE user_id = v_user_id OR user_id IN (SELECT id FROM auth.users WHERE email = 'admin@ugra.app');
  DELETE FROM auth.users WHERE id = v_user_id OR email = 'admin@ugra.app';

  -- auth.users tablosuna admin kullanıcısını ekle
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'admin@ugra.app',
    v_encrypted_password,
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"business_name": "UĞRA Yönetim", "is_admin": true, "slug": "admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false
  );

  -- E-posta kimliğini auth.identities tablosuna bağla
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id) VALUES ($1, $1, $2, $3, now(), now(), now(), $4)'
    USING v_user_id::text, json_build_object('sub', v_user_id, 'email', 'admin@ugra.app')::jsonb, 'email', 'admin@ugra.app';
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ($1, $1, $2, $3, now(), now(), now())'
    USING v_user_id::text, json_build_object('sub', v_user_id, 'email', 'admin@ugra.app')::jsonb, 'email';
  END IF;

  -- public.partners ve public.profiles kayıtlarını doğrudan ekle/güncelle
  INSERT INTO public.partners (id, slug, business_name, active, status)
  VALUES (v_user_id, 'admin', 'UĞRA Yönetim', true, 'approved')
  ON CONFLICT (id) DO UPDATE SET active = true, status = 'approved';

  INSERT INTO public.profiles (id, partner_id, role, is_admin)
  VALUES (v_user_id, v_user_id, 'admin', true)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', is_admin = true;

  -- Recursion-free RLS Politikalarını Tanımla
  DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
  CREATE POLICY "Allow admins to manage all profiles"
      ON public.profiles FOR ALL
      USING (((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR auth.jwt() ->> 'email' = 'admin@ugra.app'));

  DROP POLICY IF EXISTS "Allow admins to manage all partners" ON public.partners;
  CREATE POLICY "Allow admins to manage all partners"
      ON public.partners FOR ALL
      USING (((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR auth.jwt() ->> 'email' = 'admin@ugra.app'));

  DROP POLICY IF EXISTS "Allow admins to manage all products" ON public.products;
  CREATE POLICY "Allow admins to manage all products"
      ON public.products FOR ALL
      USING (((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR auth.jwt() ->> 'email' = 'admin@ugra.app'));

  DROP POLICY IF EXISTS "Allow admins to manage all orders" ON public.orders;
  CREATE POLICY "Allow admins to manage all orders"
      ON public.orders FOR ALL
      USING (((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR auth.jwt() ->> 'email' = 'admin@ugra.app'));

END $$;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(adminSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const [copiedPartnerSqlId, setCopiedPartnerSqlId] = useState<string | null>(null);

  const copyPartnerSql = (p: Partner) => {
    const pEmail = `${p.slug}@ugra.app`;
    const pPassword = p.slug === 'arkaplan' ? 'arkaplan123' : `${p.slug}123`;
    const sql = `-- 1. Pgcrypto eklentisini aktifleştirin
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Partner kullanıcısını auth.users ve public tablolarına güvenli bir şekilde ekleyin / ilişkilendirin
DO $$
DECLARE
  v_user_id UUID := 'd1a1b1c1-d1e1-f1a1-b1c1-d1e1f1a1b1c1';
  v_partner_id UUID;
  v_encrypted_password TEXT;
  v_email TEXT := '${pEmail}';
  v_business_name TEXT := '${p.business_name.replace(/'/g, "''")}';
  v_slug TEXT := '${p.slug}';
BEGIN
  -- '${pPassword}' şifresi için bcrypt hash üret
  v_encrypted_password := extensions.crypt('${pPassword}', extensions.gen_salt('bf', 10));

  -- Eğer zaten bu e-posta ile bir auth kullanıcısı varsa onun ID'sini al
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  -- Eğer auth kullanıcısı yoksa yeni bir tane oluştur
  IF v_user_id IS NULL THEN
    v_user_id := uuid_generate_v4();
    
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new,
      recovery_token, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, v_encrypted_password, now(), now(), now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('business_name', v_business_name, 'slug', v_slug, 'role', 'owner'),
      now(), now(), '', '', '', '', false
    );

    -- E-posta kimliğini auth.identities tablosuna bağla
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
    ) THEN
      EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id) VALUES ($1, $1, $2, $3, now(), now(), now(), $4)'
      USING v_user_id::text, json_build_object('sub', v_user_id, 'email', v_email)::jsonb, 'email', v_email;
    ELSE
      EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ($1, $1, $2, $3, now(), now(), now())'
      USING v_user_id::text, json_build_object('sub', v_user_id, 'email', v_email)::jsonb, 'email';
    END IF;
  END IF;

  -- Mevcut partners tablosundan slug ile kaydı bul
  SELECT id INTO v_partner_id FROM public.partners WHERE slug = v_slug;

  -- Eğer partners kaydı yoksa oluştur
  IF v_partner_id IS NULL THEN
    v_partner_id := v_user_id;
    INSERT INTO public.partners (id, slug, business_name, active, status)
    VALUES (v_partner_id, v_slug, v_business_name, true, 'approved');
  ELSE
    -- Varsa onaylı ve aktif yap
    UPDATE public.partners SET active = true, status = 'approved' WHERE id = v_partner_id;
  END IF;

  -- Profiles kaydını oluştur veya güncelle
  INSERT INTO public.profiles (id, partner_id, role, is_admin)
  VALUES (v_user_id, v_partner_id, 'owner', false)
  ON CONFLICT (id) DO UPDATE SET partner_id = v_partner_id, role = 'owner', is_admin = false;

END $$;`;

    navigator.clipboard.writeText(sql);
    setCopiedPartnerSqlId(p.id);
    setTimeout(() => setCopiedPartnerSqlId(null), 2000);
  };

  // Data States
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<(Product & { partner_name?: string })[]>([]);
  const [orders, setOrders] = useState<(Order & { partner_name?: string })[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filters
  const [partnerSearch, setPartnerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Audit Logs Filters
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [orderNoFilter, setOrderNoFilter] = useState('');
  const [selectedLogDetails, setSelectedLogDetails] = useState<any | null>(null);

  // Modals / Edit Forms State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    business_name: '',
    slug: '',
    phone: '',
    address: '',
    category: 'Cafe',
    description: '',
    logo: '',
    active: true
  });
  const [partnerSaving, setPartnerSaving] = useState(false);

  // Check auth on load
  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      const user = await db.getCurrentUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const adminCheck = await db.isUserAdmin(user.id);
      setIsAdmin(adminCheck);
      if (adminCheck) {
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error checking admin auth:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Fetch all required data from db services
      const pts = await db.getAdminPartners();
      setPartners(pts);

      const prds = await db.adminGetAllProducts();
      setProducts(prds);

      const ords = await db.adminGetAllOrders();
      setOrders(ords);

      const custs = await db.adminGetAllCustomers();
      setCustomers(custs);

      const tkts = await db.getSupportTickets();
      setSupportTickets(tkts);

      const logs = await db.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAdminData();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (!email || !password) {
        throw new Error('E-posta ve şifrenizi giriniz.');
      }
      
      const res = await db.signIn(email, password);
      const user = res?.user;
      
      if (user) {
        const adminCheck = await db.isUserAdmin(user.id);
        if (!adminCheck) {
          await db.signOut();
          throw new Error('Yetkisiz erişim. Sadece yöneticiler giriş yapabilir.');
        }
        setIsAdmin(true);
        await loadAdminData();
      } else {
        throw new Error('Giriş başarısız. Bilgilerinizi kontrol edin.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Bir hata oluştu. Giriş bilgilerinizi kontrol edin.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await db.signOut();
    setIsAdmin(false);
    setActiveTab('dashboard');
  };

  // --- PARTNER ACTIONS ---
  const handleApprovePartner = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      await db.adminApprovePartner(partnerId);
      setPartners(partners.map(p => p.id === partnerId ? { ...p, status: 'approved', active: true } : p));

      await db.logAction({
        partner_id: partnerId,
        partner_name: partner?.business_name,
        user_id: 'admin_id',
        action: 'PARTNER_STATUS_CHANGED',
        entity_type: 'partner',
        entity_id: partnerId,
        details: {
          business_name: partner?.business_name,
          old_status: partner?.status,
          new_status: 'approved',
          active: true,
          updated_by: 'admin'
        }
      });
    } catch (err) {
      console.error('Error approving partner:', err);
    }
  };

  const handleRejectPartner = async (partnerId: string) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      await db.adminRejectPartner(partnerId);
      setPartners(partners.map(p => p.id === partnerId ? { ...p, status: 'rejected', active: false } : p));

      await db.logAction({
        partner_id: partnerId,
        partner_name: partner?.business_name,
        user_id: 'admin_id',
        action: 'PARTNER_STATUS_CHANGED',
        entity_type: 'partner',
        entity_id: partnerId,
        details: {
          business_name: partner?.business_name,
          old_status: partner?.status,
          new_status: 'rejected',
          active: false,
          updated_by: 'admin'
        }
      });
    } catch (err) {
      console.error('Error rejecting partner:', err);
    }
  };

  const handleSaveNewPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerSaving(true);
    try {
      const created = await db.adminCreatePartner({
        business_name: newPartner.business_name,
        slug: newPartner.slug || newPartner.business_name.toLowerCase().trim().replace(/\s+/g, '-'),
        phone: newPartner.phone,
        address: newPartner.address,
        category: newPartner.category,
        description: newPartner.description,
        logo: newPartner.logo,
        active: newPartner.active
      });
      setPartners([created, ...partners]);
      setIsAddPartnerOpen(false);
      setNewPartner({
        business_name: '',
        slug: '',
        phone: '',
        address: '',
        category: 'Cafe',
        description: '',
        logo: '',
        active: true
      });

      await db.logAction({
        partner_id: created.id,
        partner_name: created.business_name,
        user_id: 'admin_id',
        action: 'PARTNER_STATUS_CHANGED',
        entity_type: 'partner',
        entity_id: created.id,
        details: {
          business_name: created.business_name,
          status: 'approved',
          active: true,
          created_by: 'admin'
        }
      });
    } catch (err: any) {
      alert('Mağaza eklenirken hata: ' + err.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setPartnerSaving(true);
    try {
      const oldPartner = partners.find(p => p.id === editingPartner.id);
      const updated = await db.adminUpdatePartner(editingPartner.id, editingPartner);
      setPartners(partners.map(p => p.id === editingPartner.id ? updated : p));
      setEditingPartner(null);

      const isStatusChanged = oldPartner && (oldPartner.active !== editingPartner.active || oldPartner.status !== editingPartner.status);
      if (isStatusChanged) {
        await db.logAction({
          partner_id: editingPartner.id,
          partner_name: editingPartner.business_name,
          user_id: 'admin_id',
          action: 'PARTNER_STATUS_CHANGED',
          entity_type: 'partner',
          entity_id: editingPartner.id,
          details: {
            business_name: editingPartner.business_name,
            old_active: oldPartner.active,
            new_active: editingPartner.active,
            old_status: oldPartner.status,
            new_status: editingPartner.status,
            updated_by: 'admin'
          }
        });
      }
    } catch (err: any) {
      alert('Güncelleme hatası: ' + err.message);
    } finally {
      setPartnerSaving(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Bu partneri silmek istediğinize emin misiniz? Tüm ürünleri ve siparişleri de silinebilir.')) return;
    try {
      const partner = partners.find(p => p.id === id);
      await db.adminDeletePartner(id);
      setPartners(partners.filter(p => p.id !== id));

      await db.logAction({
        partner_id: id,
        partner_name: partner?.business_name,
        user_id: 'admin_id',
        action: 'PARTNER_STATUS_CHANGED',
        entity_type: 'partner',
        entity_id: id,
        details: {
          business_name: partner?.business_name,
          deleted: true,
          deleted_by: 'admin'
        }
      });
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  // --- ORDER STATUS ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await db.updateOrderStatus(orderId, status);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));

      await db.logAction({
        partner_id: order?.partner_id,
        partner_name: order?.partner_name,
        user_id: 'admin_id',
        action: 'ORDER_STATUS_CHANGED',
        entity_type: 'order',
        entity_id: orderId,
        details: {
          customer_name: order?.customer_name,
          old_status: order?.status,
          new_status: status,
          total_price: order?.total_price,
          updated_by: 'admin'
        }
      });
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // --- TICKET ACTIONS ---
  const handleResolveTicket = async (ticketId: string, status: 'cozuldu' | 'iptal') => {
    try {
      const ticket = supportTickets.find(t => t.id === ticketId);
      await db.updateSupportTicketStatus(ticketId, status);
      setSupportTickets(supportTickets.map(t => t.id === ticketId ? { ...t, status } : t));

      await db.logAction({
        partner_id: ticket?.partner_id,
        partner_name: ticket?.business_name,
        user_id: 'admin_id',
        action: 'SUPPORT_TICKET_CLOSED',
        entity_type: 'support_ticket',
        entity_id: ticketId,
        details: {
          subject: ticket?.subject,
          status: status,
          closed_by: 'admin'
        }
      });
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  // --- COMPUTED DATA FOR DASHBOARD & ANALYTICS ---
  const pendingApplications = partners.filter(p => p.status === 'pending');
  const approvedPartners = partners.filter(p => p.status === 'approved');
  const totalActiveProducts = products.filter(p => p.active).length;
  const completedOrders = orders.filter(o => o.status === 'tamamlandi');
  const totalRevenue = completedOrders.reduce((acc, curr) => acc + curr.total_price, 0);

  // Stats over time for chart (grouped by date)
  const ordersByDayMap = new Map();
  orders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const price = o.status === 'tamamlandi' ? Number(o.total_price) : 0;
    const current = ordersByDayMap.get(day) || { day, siparis: 0, gelir: 0 };
    current.siparis += 1;
    current.gelir += price;
    ordersByDayMap.set(day, current);
  });
  const ordersByDayData = Array.from(ordersByDayMap.values()).reverse().slice(-7);

  // Group partners by category for chart
  const partnersByCategoryMap = new Map();
  partners.forEach(p => {
    const cat = p.category || 'Cafe';
    partnersByCategoryMap.set(cat, (partnersByCategoryMap.get(cat) || 0) + 1);
  });
  const categoryData = Array.from(partnersByCategoryMap.entries()).map(([name, value]) => ({ name, value }));

  const COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#B1B2FF', '#E38B29'];

  // Top Partners list
  const partnerPerformance = approvedPartners.map(p => {
    const pOrders = orders.filter(o => o.partner_id === p.id && o.status === 'tamamlandi');
    const totalSales = pOrders.reduce((acc, curr) => acc + Number(curr.total_price), 0);
    return {
      name: p.business_name,
      orders: pOrders.length,
      sales: totalSales
    };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);


  if (loading && isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-foreground flex items-center justify-center font-sans antialiased">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">UĞRA Yönetici Paneli yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Admin Auth Guard Page
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col justify-between p-4 md:p-8 font-sans antialiased">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group bg-transparent border-0">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Ana Sayfa</span>
            </button>
          </Link>

          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></span>
            <span className="text-muted-foreground">
              {isSupabaseConfigured ? 'Supabase Bağlı' : 'Yerel Demo Modu'}
            </span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-10">
          <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-8">
              <div className="font-sans font-extrabold tracking-wider text-4xl text-foreground select-none mb-2 flex items-center justify-center gap-2">
                UĞRA<span className="text-primary">.</span>
                <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full uppercase font-semibold">Yönetici</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                UĞRA Platformu Sistem Yönetici Girişi
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-xl p-3.5 mb-6 leading-relaxed">
                <strong>Demo Notu:</strong> E-posta olarak <strong>admin@ugra.app</strong> girerek şifre ne olursa olsun doğrudan giriş yapabilirsiniz!
              </div>
            )}

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3.5 mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Yönetici E-Posta
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                  <input
                    type="email"
                    placeholder="admin@ugra.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Şifre
                </label>
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

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm mt-6 shadow-lg shadow-primary/15"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Yönetici Girişi Yap
                  </>
                )}
              </button>
            </form>

            {isSupabaseConfigured && (
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supabase Auth Kurulumu</span>
                  <button
                    type="button"
                    onClick={() => setShowSqlGuide(!showSqlGuide)}
                    className="text-xs text-primary hover:underline cursor-pointer bg-transparent border-0"
                  >
                    {showSqlGuide ? 'Rehberi Gizle' : 'Nasıl Kurulur?'}
                  </button>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2.5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Eğer ilk defa giriş yapıyorsanız ve <strong>"Invalid login credentials"</strong> hatası alıyorsanız, Supabase Authentication veritabanında <strong>admin@ugra.app</strong> kullanıcısının oluşturulması gerekir.
                  </p>
                  
                  <button
                    type="button"
                    onClick={copySqlToClipboard}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.08] text-foreground text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">SQL Kodu Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                        <span>SQL Kurulum Kodunu Kopyala</span>
                      </>
                    )}
                  </button>
                </div>

                {showSqlGuide && (
                  <div className="space-y-3 bg-[#0A0A0B] border border-white/5 rounded-2xl p-4 text-xs text-muted-foreground leading-relaxed">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-primary" />
                      Kurulum Adımları:
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold">
                          Supabase Dashboard <ExternalLink className="w-3 h-3 inline" />
                        </a>
                        'a gidin.
                      </li>
                      <li>Sol menüden <strong className="text-foreground font-extrabold">"SQL Editor"</strong> sekmesine tıklayın.</li>
                      <li><strong className="text-foreground font-extrabold">"New query"</strong> butonuna basın.</li>
                      <li>Yukarıda kopyaladığınız SQL kodunu editöre yapıştırın.</li>
                      <li>Sağ alttaki <strong className="text-foreground font-extrabold">"Run"</strong> butonuna basarak kodu çalıştırın.</li>
                      <li>Kayıt başarıyla oluşturulduğunda bu ekrana dönüp giriş yapabilirsiniz.</li>
                    </ol>
                    <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-muted-foreground/60 leading-normal">
                      * Bu SQL scripti <strong className="text-foreground">admin@ugra.app</strong> kullanıcısını şifresi <strong className="text-foreground">gokougra123</strong> olacak şekilde auth.users tablonuza doğrudan ve güvenli bir şekilde ekler.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground/50 py-4">
          © 2026 UĞRA Teknolojileri A.Ş. Tüm hakları saklıdır.
        </div>
      </div>
    );
  }

  // FILTERED LISTS
  const filteredPartners = partners.filter(p => 
    p.business_name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    (p.phone && p.phone.includes(partnerSearch)) ||
    p.slug.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.partner_name && p.partner_name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.id.includes(orderSearch) ||
    (o.partner_name && o.partner_name.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    (c.stores && c.stores.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const actionLabels: Record<string, string> = {
    ORDER_STATUS_CHANGED: 'Sipariş Durumu Değiştirildi',
    ORDER_DELETED: 'Sipariş Silindi',
    PRODUCT_ADDED: 'Ürün Eklendi',
    PRODUCT_UPDATED: 'Ürün Güncellendi',
    PRODUCT_DELETED: 'Ürün Silindi',
    PRICE_CHANGED: 'Fiyat Değiştirildi',
    STOCK_CHANGED: 'Stok Değiştirildi',
    WORKING_HOURS_UPDATED: 'Çalışma Saatleri Güncellendi',
    LOGO_UPDATED: 'Logo Değiştirildi',
    GALLERY_UPDATED: 'Galeri Güncellendi',
    PARTNER_UPDATED: 'İşletme Bilgileri Güncellendi',
    SUPPORT_TICKET_CREATED: 'Destek Talebi Oluşturuldu',
    SUPPORT_TICKET_CLOSED: 'Destek Talebi Kapatıldı',
    PARTNER_STATUS_CHANGED: 'Bayi Hesabı Pasif/Aktif'
  };

  const getLogSummary = (log: AuditLog) => {
    const details = log.details || {};
    switch (log.action) {
      case 'ORDER_STATUS_CHANGED':
        return `${details.customer_name || 'Müşteri'} siparişinin durumu "${details.old_status || '-'}" -> "${details.new_status || '-'}" yapıldı. (Tutar: ${details.total_price || 0}₺)`;
      case 'ORDER_DELETED':
        return `${details.customer_name || 'Müşteri'} siparişi kalıcı olarak silindi. (Tutar: ${details.total_price || 0}₺)`;
      case 'PRODUCT_ADDED':
        return `"${details.title || '-'}" isimli ürün eklendi. (Fiyat: ${details.price || 0}₺, Stok: ${details.stock ?? 'Sınırsız'})`;
      case 'PRODUCT_UPDATED':
        return `"${details.title || '-'}" isimli ürün güncellendi.`;
      case 'PRODUCT_DELETED':
        return `"${details.title || '-'}" isimli ürün silindi.`;
      case 'PRICE_CHANGED':
        return `"${details.product_title || '-'}" ürünü fiyatı değiştirildi: ${details.old_price || 0}₺ -> ${details.new_price || 0}₺`;
      case 'STOCK_CHANGED':
        return `"${details.product_title || '-'}" ürünü stok durumu değiştirildi: ${details.old_stock || 0} -> ${details.new_stock || 0}`;
      case 'WORKING_HOURS_UPDATED':
        return `Çalışma saatleri güncellendi.`;
      case 'LOGO_UPDATED':
        return `Mağaza logosu değiştirildi.`;
      case 'GALLERY_UPDATED':
        return details.type === 'image_added' ? `Galeriye yeni fotoğraf eklendi.` : `Galeriden fotoğraf silindi.`;
      case 'PARTNER_UPDATED':
        return `İşletme kategorisi/bilgileri güncellendi: ${details.business_name || '-'}`;
      case 'SUPPORT_TICKET_CREATED':
        return `Konu: "${details.subject || '-'}" olan yeni bir destek talebi açıldı.`;
      case 'SUPPORT_TICKET_CLOSED':
        return `"${details.subject || '-'}" destek talebi çözülerek kapatıldı.`;
      case 'PARTNER_STATUS_CHANGED':
        return `Bayi durumu değiştirildi. Aktif: ${details.active ? 'Evet' : 'Hayır'}. Durum: ${details.new_status || '-'}`;
      default:
        return JSON.stringify(details);
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (selectedPartnerFilter && log.partner_id !== selectedPartnerFilter) {
      return false;
    }
    if (selectedActionFilter && log.action !== selectedActionFilter) {
      return false;
    }
    if (userIdFilter && !log.user_id?.toLowerCase().includes(userIdFilter.toLowerCase())) {
      return false;
    }
    if (orderNoFilter) {
      const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
      const entityIdStr = log.entity_id ? log.entity_id.toLowerCase() : '';
      const target = orderNoFilter.toLowerCase();
      if (!detailsStr.includes(target) && !entityIdStr.includes(target)) {
        return false;
      }
    }
    if (startDateFilter) {
      const logTime = new Date(log.created_at || '').getTime();
      const startTime = new Date(startDateFilter).getTime();
      if (logTime < startTime) {
        return false;
      }
    }
    if (endDateFilter) {
      const logTime = new Date(log.created_at || '').getTime();
      const endTime = new Date(endDateFilter).setHours(23, 59, 59, 999);
      if (logTime > endTime) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground font-sans flex flex-col md:flex-row antialiased">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <Link href="/">
              <div className="font-sans font-extrabold tracking-wider text-2xl text-foreground select-none cursor-pointer flex items-center gap-1.5">
                UĞRA<span className="text-primary">.</span>
                <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-semibold">Admin</span>
              </div>
            </Link>
            <button 
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Yenile"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Stats Summary */}
          <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Platform Özeti</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                <div className="text-lg font-bold text-foreground">{approvedPartners.length}</div>
                <div className="text-[10px] text-muted-foreground">Aktif Bayi</div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                <div className="text-lg font-bold text-amber-500 flex items-center justify-center gap-1">
                  {pendingApplications.length}
                  {pendingApplications.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                </div>
                <div className="text-[10px] text-muted-foreground">Başvuru</div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Shield },
              { id: 'applications', label: 'Başvurular', icon: Building, badge: pendingApplications.length },
              { id: 'partners', label: 'Partnerler', icon: Users },
              { id: 'products', label: 'Ürünler', icon: Package },
              { id: 'orders', label: 'Siparişler', icon: ShoppingBag },
              { id: 'customers', label: 'Müşteriler', icon: Shield },
              { id: 'tickets', label: 'Destek Talepleri', icon: HelpCircle, badge: supportTickets.filter(t => t.status === 'acik').length },
              { id: 'reports', label: 'Raporlar', icon: BarChart3 },
              { id: 'audit_logs', label: 'Sistem Kayıtları', icon: ClipboardList },
              { id: 'settings', label: 'Ayarlar', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-0 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
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

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-white/[0.01]">
          <div className="text-center text-[10px] text-muted-foreground/40 font-mono">
            SYS: {isSupabaseConfigured ? 'SUPABASE' : 'VIRTUAL_DB'}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all cursor-pointer border-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sistem Çıkışı</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* TABS VIEW */}

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Sistem Dashboard</h1>
                <p className="text-sm text-muted-foreground">Genel UĞRA platformu metrikleri ve bekleyen işlemler.</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl text-xs hover:bg-white/[0.06] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Verileri Güncelle
              </button>
            </div>

            {/* Platform Stats Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111113] border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{approvedPartners.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Toplam Aktif Bayi</div>
                </div>
              </div>

              <div className="bg-[#111113] border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{pendingApplications.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Bekleyen Başvuru</div>
                </div>
              </div>

              <div className="bg-[#111113] border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{orders.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Toplam Sipariş</div>
                </div>
              </div>

              <div className="bg-[#111113] border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black">{totalRevenue.toLocaleString('tr-TR')} ₺</div>
                  <div className="text-xs text-muted-foreground font-medium">Platform Cirosu</div>
                </div>
              </div>
            </div>

            {/* Row with Pending Applications and Support Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Applications List (7 cols) */}
              <div className="lg:col-span-7 bg-[#111113] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Bekleyen Partner Başvuruları</h3>
                  <button onClick={() => setActiveTab('applications')} className="text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer">Tümünü Gör</button>
                </div>

                {pendingApplications.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <Building className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Onay bekleyen partner başvurusu bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApplications.map(app => (
                      <div key={app.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {app.business_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground leading-snug">{app.business_name}</h4>
                            <p className="text-xs text-muted-foreground">ugra.app/{app.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleApprovePartner(app.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                            title="Onayla"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectPartner(app.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer"
                            title="Reddet"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Support Tickets & Recent Logs (5 cols) */}
              <div className="lg:col-span-5 bg-[#111113] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Aktif Destek Talepleri</h3>
                  <button onClick={() => setActiveTab('tickets')} className="text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer">Yönet</button>
                </div>

                {supportTickets.filter(t => t.status === 'acik').length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                    <HelpCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Açık destek talebi bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportTickets.filter(t => t.status === 'acik').slice(0, 3).map(ticket => (
                      <div key={ticket.id} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase">Açık</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <h4 className="text-sm font-semibold">{ticket.subject}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Bayi: {ticket.business_name || 'Bilinmiyor'}</p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">"{ticket.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 2. PARTNER APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Partner Başvuruları</h1>
              <p className="text-sm text-muted-foreground">Sisteme yeni kaydolmuş onay bekleyen ve geçmiş başvurular.</p>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-lg">Başvuru Kayıtları</h3>
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-muted-foreground">Toplam Kayıt: {partners.length}</span>
                </div>
              </div>

              {partners.length === 0 ? (
                <div className="text-center py-16">
                  <Building className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Herhangi bir partner başvurusu bulunmuyor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">İşletme Adı</th>
                        <th className="py-3 px-4">Mağaza Adresi</th>
                        <th className="py-3 px-4">Kayıt Tarihi</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {partners.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-4 font-semibold text-foreground">{p.business_name}</td>
                          <td className="py-4 px-4 text-muted-foreground">ugra.app/{p.slug}</td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="py-4 px-4">
                            {p.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                Onay Bekliyor
                              </span>
                            )}
                            {p.status === 'approved' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Onaylandı / Aktif
                              </span>
                            )}
                            {p.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                                Reddedildi
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleApprovePartner(p.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border-0"
                                >
                                  <Check className="w-3.5 h-3.5" /> Onayla
                                </button>
                                <button 
                                  onClick={() => handleRejectPartner(p.id)}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer border-0"
                                >
                                  <X className="w-3.5 h-3.5" /> Reddet
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">İşlem Tamamlandı</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PARTNERS */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Partner Mağazalar</h1>
                <p className="text-sm text-muted-foreground">Sistemdeki tüm kayıtlı işletmeler, bayi ekleme ve düzenleme.</p>
              </div>
              <button 
                onClick={() => setIsAddPartnerOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border-0 shadow-lg shadow-primary/10"
              >
                <Plus className="w-4.5 h-4.5" /> Yeni Partner Ekle
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="İşletme adı, adres veya link ile ara..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary/40 focus:bg-white/[0.04] outline-none transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Partners List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPartners.map(p => (
                <div key={p.id} className="bg-[#111113] border border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
                  
                  {/* Partner Logo and Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-primary text-xl shadow-inner">
                      {p.logo ? (
                        <img referrerPolicy="no-referrer" src={p.logo} alt={p.business_name} className="w-full h-full object-cover" />
                      ) : (
                        p.business_name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-foreground truncate leading-tight">{p.business_name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}>
                          {p.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">ugra.app/{p.slug}</span>
                      </p>
                      <div className="text-xs text-muted-foreground/80 line-clamp-2 pt-1 font-medium">
                        {p.description || 'Açıklama girilmemiş.'}
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="border-t border-white/5 pt-3.5 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                      <span>{p.phone || 'Telefon belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{p.address || 'Adres belirtilmemiş'}</span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg text-muted-foreground">
                      Kategori: {p.category || 'Belirtilmemiş'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyPartnerSql(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Supabase Auth Kurulum SQL Kodunu Kopyala"
                      >
                        {copiedPartnerSqlId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Kopyalandı!</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            <span>Auth SQL</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setEditingPartner(p)}
                        className="p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePartner(p.id)}
                        className="p-2 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 text-red-400 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD PARTNER MODAL */}
            {isAddPartnerOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-[#111113] border border-white/5 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      Yeni Partner Ekle
                    </h3>
                    <button onClick={() => setIsAddPartnerOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveNewPartner} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">İşletme Adı</label>
                        <input
                          type="text"
                          required
                          value={newPartner.business_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            const generatedSlug = val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                            setNewPartner({ ...newPartner, business_name: val, slug: generatedSlug });
                          }}
                          placeholder="Örn: Kahve Evi"
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Mağaza Linki (Slug)</label>
                        <input
                          type="text"
                          required
                          value={newPartner.slug}
                          onChange={(e) => setNewPartner({ ...newPartner, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          placeholder="kahve-evi"
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
                        <select
                          value={newPartner.category}
                          onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                          className="w-full bg-[#111113] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-foreground focus:border-primary/40 outline-none"
                        >
                          {['Cafe', 'Restoran', 'Moda', 'Çiçekçi', 'Market', 'Diğer'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Telefon</label>
                        <input
                          type="text"
                          value={newPartner.phone}
                          onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                          placeholder="0532..."
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Logo URL</label>
                      <input
                        type="url"
                        value={newPartner.logo}
                        onChange={(e) => setNewPartner({ ...newPartner, logo: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Adres</label>
                      <textarea
                        value={newPartner.address}
                        onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                        placeholder="Adres bilgisi..."
                        rows={2}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Açıklama</label>
                      <textarea
                        value={newPartner.description}
                        onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                        placeholder="Mağaza hakkında kısa bilgi..."
                        rows={3}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="new_active"
                        checked={newPartner.active}
                        onChange={(e) => setNewPartner({ ...newPartner, active: e.target.checked })}
                        className="rounded bg-white/[0.02] border border-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <label htmlFor="new_active" className="text-sm font-semibold cursor-pointer">Bu mağaza aktif olsun ve yayına alınsın</label>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddPartnerOpen(false)}
                        className="flex-1 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-muted-foreground hover:text-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all border-0"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={partnerSaving}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all border-0"
                      >
                        {partnerSaving ? 'Ekleniyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT PARTNER MODAL */}
            {editingPartner && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-[#111113] border border-white/5 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold flex items-center gap-2">
                      <Edit className="w-5 h-5 text-primary" />
                      Partner Bilgilerini Düzenle
                    </h3>
                    <button onClick={() => setEditingPartner(null)} className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePartner} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">İşletme Adı</label>
                        <input
                          type="text"
                          required
                          value={editingPartner.business_name}
                          onChange={(e) => setEditingPartner({ ...editingPartner, business_name: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Mağaza Linki (Slug)</label>
                        <input
                          type="text"
                          required
                          value={editingPartner.slug}
                          onChange={(e) => setEditingPartner({ ...editingPartner, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Kategori</label>
                        <select
                          value={editingPartner.category}
                          onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value })}
                          className="w-full bg-[#111113] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-foreground focus:border-primary/40 outline-none"
                        >
                          {['Cafe', 'Restoran', 'Moda', 'Çiçekçi', 'Market', 'Diğer'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Telefon</label>
                        <input
                          type="text"
                          value={editingPartner.phone || ''}
                          onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Logo URL</label>
                      <input
                        type="url"
                        value={editingPartner.logo || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, logo: e.target.value })}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Adres</label>
                      <textarea
                        value={editingPartner.address || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, address: e.target.value })}
                        rows={2}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Açıklama</label>
                      <textarea
                        value={editingPartner.description || ''}
                        onChange={(e) => setEditingPartner({ ...editingPartner, description: e.target.value })}
                        rows={3}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-3 text-sm focus:border-primary/40 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        id="edit_active"
                        checked={editingPartner.active}
                        onChange={(e) => setEditingPartner({ ...editingPartner, active: e.target.checked })}
                        className="rounded bg-white/[0.02] border border-white/10 text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <label htmlFor="edit_active" className="text-sm font-semibold cursor-pointer">Mağaza aktif olsun ve yayına alınsın</label>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingPartner(null)}
                        className="flex-1 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-muted-foreground hover:text-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all border-0"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={partnerSaving}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all border-0"
                      >
                        {partnerSaving ? 'Güncelleniyor...' : 'Güncelle'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Platform Ürünleri</h1>
              <p className="text-sm text-muted-foreground">Tüm bayi mağazalar tarafından yüklenen toplam {products.length} ürünün listesi.</p>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ürün adı veya mağaza adıyla ara..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary/40 focus:bg-white/[0.04] outline-none transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Products Table Card */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Arama kriterlerine uygun ürün bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Görsel</th>
                        <th className="py-3 px-4">Ürün Adı</th>
                        <th className="py-3 px-4">Mağaza / Sahibi</th>
                        <th className="py-3 px-4">Fiyat</th>
                        <th className="py-3 px-4">Stok</th>
                        <th className="py-3 px-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-11 h-11 bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden shrink-0">
                              {p.image ? (
                                <img referrerPolicy="no-referrer" src={p.image} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">YOK</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{p.title}</td>
                          <td className="py-3 px-4 text-primary font-medium">{p.partner_name || 'Bilinmeyen Mağaza'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-foreground">{p.price} ₺</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{p.stock} adet</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.active ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                              {p.active ? 'Satışta' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Platform Siparişleri</h1>
              <p className="text-sm text-muted-foreground">Tüm üye mağazalardan yapılan toplam {orders.length} siparişin listesi ve durumu.</p>
            </div>

            {/* Search filter */}
            <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Müşteri adı, sipariş ID veya mağaza ile ara..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary/40 focus:bg-white/[0.04] outline-none transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Orders Table Card */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Arama kriterlerine uygun sipariş kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Sipariş ID</th>
                        <th className="py-3 px-4">Mağaza</th>
                        <th className="py-3 px-4">Müşteri</th>
                        <th className="py-3 px-4">Ürünler</th>
                        <th className="py-3 px-4">Tutar</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4 text-right">Durum Güncelle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">#{o.id.substring(0, 8)}</td>
                          <td className="py-3.5 px-4 font-semibold text-primary">{o.partner_name || 'Mağaza'}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{o.customer_name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{o.customer_phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-xs space-y-0.5 max-w-xs font-medium">
                              {o.items && o.items.map((item, idx) => (
                                <div key={idx} className="truncate">
                                  • {item.title} <span className="text-primary font-bold">x{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-extrabold text-foreground">{o.total_price} ₺</td>
                          <td className="py-3.5 px-4">
                            {o.status === 'beklemede' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500">Beklemede</span>}
                            {o.status === 'hazirlaniyor' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">Hazırlanıyor</span>}
                            {o.status === 'yolda' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-400">Yolda</span>}
                            {o.status === 'tamamlandi' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Tamamlandı</span>}
                            {o.status === 'iptal' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">İptal Edildi</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as any)}
                              className="bg-[#111113] border border-white/5 rounded-lg py-1 px-2 text-xs text-foreground outline-none focus:border-primary/40"
                            >
                              <option value="beklemede">Beklemede</option>
                              <option value="hazirlaniyor">Hazırlanıyor</option>
                              <option value="yolda">Yolda</option>
                              <option value="tamamlandi">Tamamlandı</option>
                              <option value="iptal">İptal</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Kullanıcı Directory</h1>
              <p className="text-sm text-muted-foreground">Tüm siparişlerden süzülmüş, platformu kullanan tekil müşteriler ve iletişim kanalları.</p>
            </div>

            {/* Filter customer search */}
            <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Müşteri ismi veya telefon ile directory ara..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary/40 focus:bg-white/[0.04] outline-none transition-all placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Customers table */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Müşteri kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Müşteri Bilgisi</th>
                        <th className="py-3 px-4">Telefon No</th>
                        <th className="py-3 px-4">Son Sipariş Adresi</th>
                        <th className="py-3 px-4">Alışveriş Sayısı</th>
                        <th className="py-3 px-4">Sipariş Verdiği Mağazalar</th>
                        <th className="py-3 px-4 text-right">Son Sipariş Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredCustomers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                                {c.name.charAt(0)}
                              </div>
                              <div className="font-semibold text-foreground">{c.name}</div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-muted-foreground">{c.phone}</td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">{c.address}</td>
                          <td className="py-3.5 px-4 text-center font-bold font-mono text-foreground">{c.orderCount} sipariş</td>
                          <td className="py-3.5 px-4 text-xs text-primary font-medium max-w-xs truncate">{c.stores}</td>
                          <td className="py-3.5 px-4 text-right text-xs text-muted-foreground">
                            {new Date(c.lastOrderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Bayi Destek Talepleri</h1>
              <p className="text-sm text-muted-foreground">UĞRA partnerleri tarafından açılan platform destek ve entegrasyon talepleri.</p>
            </div>

            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Destek Gelen Kutusu</h3>

              {supportTickets.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Herhangi bir destek talebi bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map(ticket => (
                    <div key={ticket.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                        <div>
                          <span className="text-xs text-muted-foreground font-semibold">Bayi Mağaza: </span>
                          <span className="text-sm font-extrabold text-primary">{ticket.business_name || 'Bilinmeyen Bayi'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground font-mono">{new Date(ticket.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                          {ticket.status === 'acik' && <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold uppercase tracking-wider text-[10px]">Açık</span>}
                          {ticket.status === 'cozuldu' && <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Çözüldü</span>}
                          {ticket.status === 'iptal' && <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider text-[10px]">İptal</span>}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-base text-foreground">{ticket.subject}</h4>
                        <p className="text-sm text-muted-foreground/90 whitespace-pre-line leading-relaxed italic bg-white/[0.01] p-3 rounded-xl border border-white/5">
                          "{ticket.message}"
                        </p>
                      </div>

                      {ticket.status === 'acik' && (
                        <div className="flex items-center gap-2 pt-2 justify-end">
                          <button 
                            onClick={() => handleResolveTicket(ticket.id, 'cozuldu')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer border-0"
                          >
                            <Check className="w-3.5 h-3.5" /> Talebi Çözüldü İşaretle
                          </button>
                          <button 
                            onClick={() => handleResolveTicket(ticket.id, 'iptal')}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer border-0"
                          >
                            <X className="w-3.5 h-3.5" /> İptal Et
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Finansal Raporlar & Analizler</h1>
              <p className="text-sm text-muted-foreground">UĞRA platformu bayi performansları, ciro grafikleri ve kategori istatistikleri.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Ciro Trend Chart (8 cols) */}
              <div className="lg:col-span-8 bg-[#111113] border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">Son Günlerde Sipariş & Gelir Trendi</h3>
                {ordersByDayData.length === 0 ? (
                  <div className="text-center py-24 text-muted-foreground">Yetersiz veri bulunuyor.</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ordersByDayData}>
                        <defs>
                          <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4D96FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4D96FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#52525B" fontSize={11} />
                        <YAxis stroke="#52525B" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#111113', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                        <Area type="monotone" dataKey="gelir" stroke="#4D96FF" strokeWidth={2} fillOpacity={1} fill="url(#colorGelir)" name="Ciro (₺)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category Pie Chart (4 cols) */}
              <div className="lg:col-span-4 bg-[#111113] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="font-bold text-lg mb-4">Mağaza Kategori Dağılımı</h3>
                {categoryData.length === 0 ? (
                  <div className="text-center py-24 text-muted-foreground">Yetersiz veri.</div>
                ) : (
                  <>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#111113', borderColor: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 pt-4 text-xs">
                      {categoryData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-bold">{item.value} mağaza</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top performing partners */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">En Yüksek Ciro Yapan Partner Mağazalar</h3>
              {partnerPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Henüz tamamlanan sipariş bulunmuyor.</div>
              ) : (
                <div className="space-y-4">
                  {partnerPerformance.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm font-medium">
                        <div className="text-muted-foreground">{item.orders} tamamlanan sipariş</div>
                        <div className="font-mono font-black text-foreground">{item.sales.toLocaleString('tr-TR')} ₺ ciro</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8.5 AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Sistem İşlem Geçmişi (Audit Logs)</h1>
                <p className="text-sm text-muted-foreground">Tüm bayi ve yönetici işlemlerinin detaylı ve geriye dönük merkezi denetim kayıtları.</p>
              </div>
              <button
                onClick={async () => {
                  setLoading(true);
                  const logs = await db.getAuditLogs();
                  setAuditLogs(logs);
                  setLoading(false);
                }}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all self-start sm:self-center"
              >
                <RefreshCw className="w-4 h-4" /> Yenile
              </button>
            </div>

            {/* Filter Panel */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-4">Gelişmiş Arama ve Filtreleme</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                
                {/* Partner Filter */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">Bayi Seç</label>
                  <select
                    value={selectedPartnerFilter}
                    onChange={(e) => setSelectedPartnerFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">Tüm Bayiler</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.business_name}</option>
                    ))}
                  </select>
                </div>

                {/* Action Filter */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">İşlem Türü</label>
                  <select
                    value={selectedActionFilter}
                    onChange={(e) => setSelectedActionFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="">Tüm İşlemler</option>
                    <option value="ORDER_STATUS_CHANGED">Sipariş Durumu Değiştirildi</option>
                    <option value="ORDER_DELETED">Sipariş Silindi</option>
                    <option value="PRODUCT_ADDED">Ürün Eklendi</option>
                    <option value="PRODUCT_UPDATED">Ürün Güncellendi</option>
                    <option value="PRODUCT_DELETED">Ürün Silindi</option>
                    <option value="PRICE_CHANGED">Fiyat Değiştirildi</option>
                    <option value="STOCK_CHANGED">Stok Değiştirildi</option>
                    <option value="WORKING_HOURS_UPDATED">Çalışma Saatleri Güncellendi</option>
                    <option value="LOGO_UPDATED">Logo Değiştirildi</option>
                    <option value="GALLERY_UPDATED">Galeri Fotoğrafı Eklendi/Silindi</option>
                    <option value="PARTNER_UPDATED">İşletme Bilgileri Güncellendi</option>
                    <option value="SUPPORT_TICKET_CREATED">Destek Talebi Oluşturuldu</option>
                    <option value="SUPPORT_TICKET_CLOSED">Destek Talebi Kapatıldı</option>
                    <option value="PARTNER_STATUS_CHANGED">Partner Hesabı Pasif/Aktif</option>
                  </select>
                </div>

                {/* User ID filter */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">Kullanıcı ID / Kod</label>
                  <input
                    type="text"
                    placeholder="User UUID giriniz"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                {/* Order ID Filter */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">Sipariş / Ürün No</label>
                  <input
                    type="text"
                    placeholder="Arama yapın..."
                    value={orderNoFilter}
                    onChange={(e) => setOrderNoFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs text-muted-foreground font-semibold mb-1.5">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full bg-[#1A1A1E] text-foreground border border-white/5 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

              </div>

              {/* Reset Filter Button */}
              {(selectedPartnerFilter || selectedActionFilter || userIdFilter || orderNoFilter || startDateFilter || endDateFilter) && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      setSelectedPartnerFilter('');
                      setSelectedActionFilter('');
                      setUserIdFilter('');
                      setOrderNoFilter('');
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Audit Log Table */}
            <div className="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase font-bold tracking-wider bg-white/[0.01]">
                      <th className="px-5 py-4">Tarih / Saat</th>
                      <th className="px-5 py-4">Bayi / Partner</th>
                      <th className="px-5 py-4">İşlem</th>
                      <th className="px-5 py-4">Açıklama / Detay</th>
                      <th className="px-5 py-4">Yapan Kullanıcı</th>
                      <th className="px-5 py-4 text-right">Aksiyonlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          Aradığınız kriterlere uygun sistem kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                          {/* Created At */}
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at || '').toLocaleString('tr-TR')}
                          </td>

                          {/* Partner Name */}
                          <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">
                            {log.partner_name || 'Sistem / Genel'}
                          </td>

                          {/* Action Badge */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action.includes('DELETED') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              log.action.includes('ADDED') || log.action.includes('CREATED') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.action.includes('STATUS') || log.action.includes('CLOSED') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {actionLabels[log.action] || log.action}
                            </span>
                          </td>

                          {/* Summary Details */}
                          <td className="px-5 py-3.5 text-muted-foreground/90 max-w-xs sm:max-w-md truncate">
                            {getLogSummary(log)}
                          </td>

                          {/* User ID */}
                          <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {log.user_id === 'admin_id' ? 'Sistem Yöneticisi' : (log.user_id ? log.user_id.slice(0, 8) + '...' : 'Sistem')}
                          </td>

                          {/* Details Button */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLogDetails(log)}
                              className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination/Total Info */}
              <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01] text-xs text-muted-foreground flex items-center justify-between">
                <span>Toplam <strong>{filteredAuditLogs.length}</strong> sistem kaydı gösteriliyor.</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Sistem Ayarları</h1>
              <p className="text-sm text-muted-foreground">UĞRA altyapı durumu ve sistem yönetimi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-white/5 pb-2.5 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-primary" />
                  Altyapı Durumu
                </h3>
                
                <div className="space-y-3.5 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Supabase Bağlantısı:</span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                      {isSupabaseConfigured ? 'BAĞLI / AKTİF' : 'YEREL DEMO MODU'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Aktif Depolama (Storage):</span>
                    <span className="text-foreground">S3 / Supabase Buckets (logos, products)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sürüm:</span>
                    <span className="font-mono text-xs text-muted-foreground">v2.4.1-prod</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sistem Lokasyonu:</span>
                    <span className="text-muted-foreground">europe-west2 (London)</span>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 text-xs leading-relaxed text-muted-foreground flex gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Sistem veri entegrasyonu tamamen otomatik çalışmaktadır. Supabase bağlı olmadığında veriler yerel tarayıcı hafızasında (localStorage) güvenli bir şekilde sanallaştırılır.
                  </span>
                </div>
              </div>

              <div className="bg-[#111113] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-lg border-b border-white/5 pb-2.5 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Yönetici Bilgileri
                </h3>
                
                <div className="space-y-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                      AD
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Sistem Yöneticisi</div>
                      <div className="text-xs text-muted-foreground">admin@ugra.app</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2 text-xs text-muted-foreground leading-normal">
                    <p>
                      <strong>İzin Derecesi:</strong> Süper Yönetici (Full root platform control).
                    </p>
                    <p>
                      Bu hesap üzerinden tüm bayilerin ürünlerini, siparişlerini ve müşteri bilgilerini görüntüleyip yönetebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 10. AUDIT LOG DETAIL MODAL */}
      {selectedLogDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-white/5 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-foreground">İşlem Detay Kaydı</h3>
                <p className="text-xs text-muted-foreground font-medium">{selectedLogDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="text-muted-foreground hover:text-foreground bg-white/[0.04] hover:bg-white/[0.08] p-1.5 rounded-lg border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Tarih / Saat:</span>
                  <span className="text-foreground">{new Date(selectedLogDetails.created_at || '').toLocaleString('tr-TR')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Bayi / Partner:</span>
                  <span className="text-foreground font-bold">{selectedLogDetails.partner_name || 'Sistem / Genel'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">İşlem Tipi:</span>
                  <span className="text-foreground">{selectedLogDetails.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Varlık Tipi / Kimliği (Entity ID):</span>
                  <span className="font-mono text-foreground text-[11px] truncate block">{selectedLogDetails.entity_type} / {selectedLogDetails.entity_id || '-'}</span>
                </div>
              </div>

              {/* Human Readable Summary */}
              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4">
                <span className="text-xs text-muted-foreground font-semibold block mb-1">İşlem Özeti:</span>
                <p className="text-sm font-medium text-foreground">{getLogSummary(selectedLogDetails)}</p>
              </div>

              {/* JSON raw block */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold block">Detaylı JSON Verisi (details):</span>
                <pre className="bg-[#1A1A1E] border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLogDetails.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl border-0 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
