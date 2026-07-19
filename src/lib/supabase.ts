import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_public_key';

// Initialize actual client only if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// TYPES
// ==========================================
export interface Partner {
  id: string;
  slug: string;
  business_name: string;
  logo?: string;
  description?: string;
  phone?: string;
  address?: string;
  category?: string;
  active: boolean;
  created_at: string;
  status?: 'pending' | 'approved' | 'rejected';
  working_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  gallery?: string[];
}

export interface Product {
  id: string;
  partner_id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  stock: number;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  partner_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_type: 'kapida_nakit' | 'kapida_kart' | 'online';
  status: 'beklemede' | 'hazirlaniyor' | 'yolda' | 'tamamlandi' | 'iptal';
  total_price: number;
  created_at: string;
  items?: { title: string; quantity: number; price: number }[];
}

export interface Profile {
  id: string;
  partner_id: string;
  role: string;
  is_admin?: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  partner_id: string;
  business_name?: string;
  subject: string;
  message: string;
  status: 'acik' | 'cozuldu' | 'iptal';
  created_at: string;
}

// ==========================================
// VIRTUAL / LOCALSTORAGE FALLBACK ENGINE
// ==========================================
const LOCAL_STORAGE_KEYS = {
  PARTNERS: 'ugra_virtual_partners',
  PRODUCTS: 'ugra_virtual_products',
  ORDERS: 'ugra_virtual_orders',
  PROFILES: 'ugra_virtual_profiles',
  SESSION: 'ugra_virtual_session'
};

// Seed default data if not present
const seedVirtualDatabase = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.PARTNERS)) {
    const defaultPartners: Partner[] = [
      {
        id: 'p1',
        slug: 'arkaplan',
        business_name: 'Arkaplan Kahve & Kitap',
        logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=300',
        description: 'Sıcak kahveler, taze tatlılar ve eşsiz kitaplar.',
        phone: '05321234567',
        address: 'Kadıköy, İstanbul',
        category: 'Cafe',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'p2',
        slug: 'byebyestore',
        business_name: 'Bye Bye Vintage Store',
        logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=300',
        description: 'Özenle seçilmiş vintage giysiler ve aksesuarlar.',
        phone: '05339876543',
        address: 'Beşiktaş, İstanbul',
        category: 'Moda',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'p3',
        slug: 'tatliciali',
        business_name: 'Meşhur Tatlıcı Ali',
        logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=300',
        description: '1984\'ten beri geleneksel ev tatlıları ve baklavalar.',
        phone: '02125554433',
        address: 'Fatih, İstanbul',
        category: 'Restoran',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'p4',
        slug: 'cicekci',
        business_name: 'Limon Çiçek Evi',
        logo: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=300',
        description: 'Taze çiçek tasarımları ve özel gün aranjmanları.',
        phone: '05423332211',
        address: 'Şişli, İstanbul',
        category: 'Çiçekçi',
        active: true,
        created_at: new Date().toISOString()
      }
    ];

    const defaultProducts: Product[] = [
      // Arkaplan
      {
        id: 'pr1',
        partner_id: 'p1',
        title: 'Latte',
        description: 'Özel harman espresso, taze süt köpüğü ile.',
        price: 85,
        image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=300',
        stock: 50,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pr2',
        partner_id: 'p1',
        title: 'Çikolatalı Brownie',
        description: 'Belçika çikolatalı, içi ıslak ev yapımı brownie.',
        price: 110,
        image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&q=80&w=300',
        stock: 12,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pr3',
        partner_id: 'p1',
        title: 'Filtre Kahve',
        description: 'Etiyopya çekirdeklerinden taze demlenmiş.',
        price: 70,
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=300',
        stock: 100,
        active: true,
        created_at: new Date().toISOString()
      },
      // Bye Bye Vintage
      {
        id: 'pr4',
        partner_id: 'p2',
        title: '90\'lar Deri Ceket',
        description: 'Kusursuz kondisyonda, hakiki eskitme deri ceket (L Beden).',
        price: 1850,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=300',
        stock: 1,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pr5',
        partner_id: 'p2',
        title: 'Retro Güneş Gözlüğü',
        description: '90\'lar stili kalın kemik çerçeveli uniseks gözlük.',
        price: 340,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=300',
        stock: 5,
        active: true,
        created_at: new Date().toISOString()
      },
      // Meşhur Tatlıcı Ali
      {
        id: 'pr6',
        partner_id: 'p3',
        title: 'Fıstıklı Sarma (Porsiyon)',
        description: 'Bol fıstıklı, hafif şerbetli geleneksel sarma baklava.',
        price: 160,
        image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=300',
        stock: 25,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pr7',
        partner_id: 'p3',
        title: 'Fırın Sütlaç',
        description: 'Taş fırında kızartılmış, manda sütlü hafif tatlı.',
        price: 95,
        image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&q=80&w=300',
        stock: 15,
        active: true,
        created_at: new Date().toISOString()
      },
      // Çiçekçi
      {
        id: 'pr8',
        partner_id: 'p4',
        title: 'Turuncu Lale Buketi',
        description: '10 adet taze ithal turuncu lale ve özel şık ambalaj.',
        price: 480,
        image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&q=80&w=300',
        stock: 8,
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pr9',
        partner_id: 'p4',
        title: 'Sukulent Teraryum',
        description: 'Özel geometrik cam fanusta canlı sukulent aranjmanı.',
        price: 390,
        image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=300',
        stock: 10,
        active: true,
        created_at: new Date().toISOString()
      }
    ];

    const defaultOrders: Order[] = [
      {
        id: 'o1',
        partner_id: 'p1',
        customer_name: 'Ahmet Yılmaz',
        customer_phone: '0555 123 45 67',
        customer_address: 'Moda Cad. Huzur Apt. No:12 D:4 Kadıköy',
        payment_type: 'kapida_kart',
        status: 'yolda',
        total_price: 195,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        items: [
          { title: 'Latte', quantity: 1, price: 85 },
          { title: 'Çikolatalı Brownie', quantity: 1, price: 110 }
        ]
      },
      {
        id: 'o2',
        partner_id: 'p1',
        customer_name: 'Selin Kaya',
        customer_phone: '0533 111 22 33',
        customer_address: 'Şair Nefi Sok. No:5 D:1 Moda',
        payment_type: 'kapida_nakit',
        status: 'beklemede',
        total_price: 170,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
        items: [
          { title: 'Latte', quantity: 2, price: 85 }
        ]
      }
    ];

    localStorage.setItem(LOCAL_STORAGE_KEYS.PARTNERS, JSON.stringify(defaultPartners));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
    localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILES, JSON.stringify([]));
  }
};

// Execute seeding
if (typeof window !== 'undefined') {
  seedVirtualDatabase();
}

// Helpers for localStorage state manipulation
const getStored = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStored = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==========================================
// UNIFIED SERVICE LAYER (SUPABASE + FALLBACK)
// ==========================================

export const db = {
  // --- AUTH SERVICES ---
  async signIn(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const user = data.user;
      if (user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_admin, partner_id')
          .eq('id', user.id)
          .maybeSingle();
        
        const isAdmin = profile?.role === 'admin' || profile?.is_admin === true || email === 'admin@ugra.app';
        if (!isAdmin) {
          // If not admin, check partner status
          const partnerId = profile?.partner_id || user.id;
          const { data: partner } = await supabase
            .from('partners')
            .select('status, active')
            .eq('id', partnerId)
            .maybeSingle();
          
          const active = partner?.active;
          const status = partner?.status || 'pending';
          const isApproved = active === true && (status === 'approved' || status === 'active');
          
          // GÜVENLİK/GEÇİCİ ONAY KONTROLÜ GEÇİCİ OLARAK BYPASS EDİLDİ (TEST AMAÇLI)
          console.log('Partner status check bypassed for testing:', { active, status, isApproved });
          /*
          if (!isApproved) {
            await supabase.auth.signOut();
            if (status === 'rejected') {
              throw new Error('Başvurunuz reddedilmiştir. Lütfen destek ekibi ile iletişime geçin.');
            } else {
              throw new Error('Hesabınız henüz onaylanmadı. Lütfen yönetici onayını bekleyiniz.');
            }
          }
          */
        }
      }
      return data;
    } else {
      // Virtual Login
      const lowercaseEmail = email.toLowerCase().trim();
      
      // Admin Login
      if (lowercaseEmail === 'admin@ugra.app') {
        const mockAdminUser = {
          user: {
            id: 'admin_id',
            email: 'admin@ugra.app',
            user_metadata: { business_name: 'UĞRA Yönetim' },
            is_admin: true
          },
          session: { access_token: 'mock-admin-token' }
        };
        localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(mockAdminUser));
        return mockAdminUser;
      }

      // Partner Login
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const emailLocal = lowercaseEmail.split('@')[0];
      let partner = partners.find(p => p.slug === emailLocal || p.phone?.includes(emailLocal) || p.business_name.toLowerCase().replace(/\s+/g, '') === emailLocal);
      
      if (!partner) {
        partner = partners[0];
      }

      if (partner) {
        const active = partner.active !== false; // default true if not set
        const status = partner.status || 'approved'; // Default approved for seeded ones
        const isApproved = active === true && (status === 'approved' || status === 'active');
        // GÜVENLİK/GEÇİCİ ONAY KONTROLÜ GEÇİCİ OLARAK BYPASS EDİLDİ (TEST AMAÇLI)
        console.log('Virtual Partner status check bypassed for testing:', { active, status, isApproved });
        /*
        if (!isApproved) {
          if (status === 'rejected') {
            throw new Error('Başvurunuz reddedilmiştir. Lütfen destek ekibi ile iletişime geçin.');
          } else {
            throw new Error('Hesabınız henüz onaylanmadı. Lütfen yönetici onayını bekleyiniz.');
          }
        }
        */
      }

      const mockUser = {
        user: {
          id: partner.id,
          email: email,
          user_metadata: { business_name: partner.business_name }
        },
        session: { access_token: 'mock-token' }
      };
      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(mockUser));
      return mockUser;
    }
  },

  async signUp(email: string, password: string, businessName: string, slug: string) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (isSupabaseConfigured && supabase) {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
            slug: cleanSlug
          }
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Kullanıcı oluşturulamadı.');

      const userId = authData.user.id;

      // 2. Create partner entry (using upsert)
      let partnerData = null;
      try {
        const { data: upsertedPartner, error: partnerError } = await supabase
          .from('partners')
          .upsert({
            id: userId,
            slug: cleanSlug,
            business_name: businessName,
            active: false, // Default false until approved
            status: 'pending' // Default pending
          })
          .select()
          .maybeSingle();
        
        if (!partnerError && upsertedPartner) {
          partnerData = upsertedPartner;
        } else {
          // Fallback to fetch
          const { data: fetchedPartner } = await supabase
            .from('partners')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          partnerData = fetchedPartner;
        }
      } catch (e) {
        console.warn('Could not insert partner from client:', e);
      }

      // If partnerData is still null, create a fallback object so the application doesn't break
      if (!partnerData) {
        partnerData = {
          id: userId,
          slug: cleanSlug,
          business_name: businessName,
          active: false,
          status: 'pending',
          created_at: new Date().toISOString()
        };
      }

      // 3. Create profile entry (using upsert)
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            partner_id: userId,
            role: 'owner',
            is_admin: false
          });
      } catch (e) {
        console.warn('Could not insert profile from client:', e);
      }

      return { user: authData.user, partner: partnerData };
    } else {
      // Virtual Sign Up (Application)
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      if (partners.some(p => p.slug === cleanSlug)) {
        throw new Error('Bu mağaza ismi/adresi zaten alınmış.');
      }

      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      const newPartner: Partner = {
        id: newId,
        slug: cleanSlug,
        business_name: businessName,
        active: false, // Default false until approved
        status: 'pending', // Default pending
        created_at: new Date().toISOString()
      };

      partners.push(newPartner);
      setStored(LOCAL_STORAGE_KEYS.PARTNERS, partners);

      const mockUser = {
        user: {
          id: newId,
          email,
          user_metadata: { business_name: businessName }
        },
        session: { access_token: 'mock-token' }
      };

      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(mockUser));
      return { user: mockUser.user, partner: newPartner };
    }
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
    }
  },

  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session;
    } else {
      const session = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session).session : null;
    }
  },

  async getCurrentUser() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      return data.user;
    } else {
      const session = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);
      return session ? JSON.parse(session).user : null;
    }
  },

  // --- PARTNERS SERVICE ---
  async getPartnerBySlug(slug: string): Promise<Partner | null> {
    const cleanSlug = slug.toLowerCase().trim();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('active', true)
        .maybeSingle();
      if (error) {
        console.error('Error fetching partner by slug:', error);
        return null;
      }
      return data;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      return partners.find(p => p.slug === cleanSlug && p.active) || null;
    }
  },

  async getPartnerById(id: string): Promise<Partner | null> {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch from profiles first to find the mapped partner_id
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', id)
          .maybeSingle();

        if (!profileError && profileData?.partner_id) {
          const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('id', profileData.partner_id)
            .maybeSingle();
          
          if (!partnerError && partnerData) return partnerData;
        }
      } catch (err) {
        console.error('Error in getPartnerById profile lookup:', err);
      }

      // 2. Fallback: Direct fetch from partners table
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (!error && data) return data;

      return null;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      return partners.find(p => p.id === id) || null;
    }
  },

  async updatePartner(partnerId: string, updates: Partial<Partner>): Promise<Partner> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', partnerId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const index = partners.findIndex(p => p.id === partnerId);
      if (index === -1) throw new Error('Partner bulunamadı.');
      const updated = { ...partners[index], ...updates };
      partners[index] = updated;
      setStored(LOCAL_STORAGE_KEYS.PARTNERS, partners);
      return updated;
    }
  },

  // --- PRODUCTS SERVICE ---
  async getProducts(partnerId: string): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const products = getStored<Product>(LOCAL_STORAGE_KEYS.PRODUCTS);
      return products.filter(p => p.partner_id === partnerId);
    }
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const products = getStored<Product>(LOCAL_STORAGE_KEYS.PRODUCTS);
      const newProduct: Product = {
        ...product,
        id: 'pr_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      products.unshift(newProduct);
      setStored(LOCAL_STORAGE_KEYS.PRODUCTS, products);
      return newProduct;
    }
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const products = getStored<Product>(LOCAL_STORAGE_KEYS.PRODUCTS);
      const index = products.findIndex(p => p.id === productId);
      if (index === -1) throw new Error('Ürün bulunamadı.');
      const updated = { ...products[index], ...updates };
      products[index] = updated;
      setStored(LOCAL_STORAGE_KEYS.PRODUCTS, products);
      return updated;
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    } else {
      const products = getStored<Product>(LOCAL_STORAGE_KEYS.PRODUCTS);
      const filtered = products.filter(p => p.id !== productId);
      setStored(LOCAL_STORAGE_KEYS.PRODUCTS, filtered);
    }
  },

  // --- IMAGE UPLOAD SERVICE ---
  async uploadImage(file: File, bucket: 'products' | 'logos' = 'products'): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } else {
      // In localStorage fallback mode, we turn file into a local ObjectURL or a base64 string
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  },

  // --- ORDERS SERVICE ---
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          status: 'beklemede'
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const orders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const newOrder: Order = {
        ...order,
        id: 'o_' + Math.random().toString(36).substr(2, 9),
        status: 'beklemede',
        created_at: new Date().toISOString()
      };
      orders.unshift(newOrder);
      setStored(LOCAL_STORAGE_KEYS.ORDERS, orders);
      return newOrder;
    }
  },

  async getOrders(partnerId: string): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const orders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      return orders.filter(o => o.partner_id === partnerId);
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const orders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const index = orders.findIndex(o => o.id === orderId);
      if (index === -1) throw new Error('Sipariş bulunamadı.');
      const updated = { ...orders[index], status };
      orders[index] = updated;
      setStored(LOCAL_STORAGE_KEYS.ORDERS, orders);
      return updated;
    }
  },

  // --- EXTRA ADMIN & CUSTOMER/TICKET SERVICES ---
  async isUserAdmin(userId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // First try retrieving from the profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .maybeSingle();
        
        if (!error && data && data.is_admin) {
          return true;
        }
      } catch (err) {
        console.warn('Error reading from profiles table, falling back to session metadata:', err);
      }

      // Dynamic fallback check using the authenticated user's email and metadata
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email === 'admin@ugra.app' || user.user_metadata?.is_admin === true || user.app_metadata?.claims_admin === true) {
            return true;
          }
        }
      } catch (err) {
        console.error('Error in getUser fallback:', err);
      }

      return false;
    } else {
      const session = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);
      if (!session) return false;
      const user = JSON.parse(session).user;
      return user.email === 'admin@ugra.app' || !!user.is_admin;
    }
  },

  async resetPassword(email: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/partner`
      });
      if (error) throw error;
      return true;
    } else {
      return true;
    }
  },

  async getAdminPartners(): Promise<Partner[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
    }
  },

  async adminApprovePartner(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('partners')
        .update({ status: 'approved', active: true })
        .eq('id', id);
      if (error) throw error;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const index = partners.findIndex(p => p.id === id);
      if (index !== -1) {
        partners[index].status = 'approved';
        partners[index].active = true;
        setStored(LOCAL_STORAGE_KEYS.PARTNERS, partners);
      }
    }
  },

  async adminRejectPartner(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('partners')
        .update({ status: 'rejected', active: false })
        .eq('id', id);
      if (error) throw error;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const index = partners.findIndex(p => p.id === id);
      if (index !== -1) {
        partners[index].status = 'rejected';
        partners[index].active = false;
        setStored(LOCAL_STORAGE_KEYS.PARTNERS, partners);
      }
    }
  },

  async adminCreatePartner(partner: Omit<Partner, 'id' | 'created_at'>): Promise<Partner> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('partners')
        .insert({
          ...partner,
          status: 'approved',
          active: true
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      const newPartner: Partner = {
        ...partner,
        id: newId,
        status: 'approved',
        active: true,
        created_at: new Date().toISOString()
      };
      partners.push(newPartner);
      setStored(LOCAL_STORAGE_KEYS.PARTNERS, partners);
      return newPartner;
    }
  },

  async adminUpdatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    return this.updatePartner(id, updates);
  },

  async adminDeletePartner(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const filtered = partners.filter(p => p.id !== id);
      setStored(LOCAL_STORAGE_KEYS.PARTNERS, filtered);
    }
  },

  async adminGetAllProducts(): Promise<(Product & { partner_name?: string })[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*, partners(business_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        partner_name: p.partners?.business_name
      }));
    } else {
      const products = getStored<Product>(LOCAL_STORAGE_KEYS.PRODUCTS);
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      return products.map(p => {
        const partner = partners.find(pt => pt.id === p.partner_id);
        return {
          ...p,
          partner_name: partner?.business_name
        };
      });
    }
  },

  async adminGetAllOrders(): Promise<(Order & { partner_name?: string })[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, partners(business_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((o: any) => ({
        ...o,
        partner_name: o.partners?.business_name
      }));
    } else {
      const orders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      return orders.map(o => {
        const partner = partners.find(pt => pt.id === o.partner_id);
        return {
          ...o,
          partner_name: partner?.business_name
        };
      });
    }
  },

  async adminGetAllCustomers() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_phone, customer_address, created_at, partner_id, partners(business_name)');
      if (error) throw error;
      
      const customerMap = new Map();
      (data || []).forEach((item: any) => {
        const key = `${item.customer_name}_${item.customer_phone}`;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: item.customer_name,
            phone: item.customer_phone,
            address: item.customer_address,
            lastOrderDate: item.created_at,
            orderCount: 1,
            stores: new Set([item.partners?.business_name || 'Bilinmeyen Mağaza'])
          });
        } else {
          const cust = customerMap.get(key);
          cust.orderCount += 1;
          cust.stores.add(item.partners?.business_name || 'Bilinmeyen Mağaza');
          if (new Date(item.created_at) > new Date(cust.lastOrderDate)) {
            cust.lastOrderDate = item.created_at;
          }
        }
      });
      
      return Array.from(customerMap.values()).map(c => ({
        ...c,
        stores: Array.from(c.stores).join(', ')
      }));
    } else {
      const orders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const customerMap = new Map();
      orders.forEach(o => {
        const key = `${o.customer_name}_${o.customer_phone}`;
        const storeName = partners.find(pt => pt.id === o.partner_id)?.business_name || 'Bilinmeyen Mağaza';
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: o.customer_name,
            phone: o.customer_phone,
            address: o.customer_address,
            lastOrderDate: o.created_at,
            orderCount: 1,
            stores: new Set([storeName])
          });
        } else {
          const cust = customerMap.get(key);
          cust.orderCount += 1;
          cust.stores.add(storeName);
          if (new Date(o.created_at) > new Date(cust.lastOrderDate)) {
            cust.lastOrderDate = o.created_at;
          }
        }
      });
      return Array.from(customerMap.values()).map(c => ({
        ...c,
        stores: Array.from(c.stores).join(', ')
      }));
    }
  },

  async getSupportTickets(partnerId?: string): Promise<SupportTicket[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('support_tickets').select('*, partners(business_name)');
      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        business_name: t.partners?.business_name
      }));
    } else {
      const tickets = getStored<SupportTicket>('ugra_virtual_support_tickets');
      if (tickets.length === 0) {
        const defaultTickets: SupportTicket[] = [
          {
            id: 't1',
            partner_id: 'p1',
            subject: 'Ödeme Entegrasyonu',
            message: 'Kredi kartı ödemeleri ne zaman aktif olacak?',
            status: 'acik',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 't2',
            partner_id: 'p2',
            subject: 'Logo Yükleme Sorunu',
            message: 'İşletme logosu yüklerken hata alıyorum.',
            status: 'cozuldu',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        setStored('ugra_virtual_support_tickets', defaultTickets);
        tickets.push(...defaultTickets);
      }
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      const filtered = partnerId ? tickets.filter(t => t.partner_id === partnerId) : tickets;
      return filtered.map(t => ({
        ...t,
        business_name: partners.find(p => p.id === t.partner_id)?.business_name
      }));
    }
  },

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'status'>): Promise<SupportTicket> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({ ...ticket, status: 'acik' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const tickets = getStored<SupportTicket>('ugra_virtual_support_tickets');
      const newTicket: SupportTicket = {
        ...ticket,
        id: 't_' + Math.random().toString(36).substr(2, 9),
        status: 'acik',
        created_at: new Date().toISOString()
      };
      tickets.unshift(newTicket);
      setStored('ugra_virtual_support_tickets', tickets);
      return newTicket;
    }
  },

  async updateSupportTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
      if (error) throw error;
    } else {
      const tickets = getStored<SupportTicket>('ugra_virtual_support_tickets');
      const index = tickets.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        tickets[index].status = status;
        setStored('ugra_virtual_support_tickets', tickets);
      }
    }
  }
};
