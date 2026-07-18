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
      return data;
    } else {
      // Virtual Login: check if there's a user or find partner by email
      // For demo convenience, password '123456' is accepted for any partner, or create profile
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      // Let's search partner by email slug
      const emailLocal = email.split('@')[0];
      let partner = partners.find(p => p.slug === emailLocal || p.phone?.includes(emailLocal));
      if (!partner) {
        // Just use first partner or create a new one to keep it frictionless
        partner = partners[0];
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

      // 2. Create partner entry (using uuid of user as partner_id to simplify, or separate uuid)
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: userId,
          slug: cleanSlug,
          business_name: businessName,
          active: true
        })
        .select()
        .single();
      
      if (partnerError) throw partnerError;

      // 3. Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          partner_id: userId,
          role: 'owner'
        });

      if (profileError) throw profileError;

      return { user: authData.user, partner: partnerData };
    } else {
      // Virtual Sign Up
      const partners = getStored<Partner>(LOCAL_STORAGE_KEYS.PARTNERS);
      if (partners.some(p => p.slug === cleanSlug)) {
        throw new Error('Bu mağaza ismi/adresi zaten alınmış.');
      }

      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      const newPartner: Partner = {
        id: newId,
        slug: cleanSlug,
        business_name: businessName,
        active: true,
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
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) return null;
      return data;
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
  }
};
