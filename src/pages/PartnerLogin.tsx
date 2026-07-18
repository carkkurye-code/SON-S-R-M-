import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { ArrowLeft, Loader2, Sparkles, Building, Lock, Mail, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';

export function PartnerLogin() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from business name
  useEffect(() => {
    if (isSignUp) {
      const generatedSlug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // collapse duplicate hyphens
      setSlug(generatedSlug);
    }
  }, [businessName, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!email || !password || !businessName || !slug) {
          throw new Error('Lütfen tüm alanları doldurunuz.');
        }
        if (password.length < 6) {
          throw new Error('Şifre en az 6 karakter olmalıdır.');
        }
        await db.signUp(email, password, businessName, slug);
      } else {
        if (!email || !password) {
          throw new Error('E-posta ve şifrenizi giriniz.');
        }
        await db.signIn(email, password);
      }
      
      // Success redirect
      setLocation('/partner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground flex flex-col justify-between p-4 md:p-8 font-sans antialiased">
      {/* Header Info */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Ana Sayfa
          </button>
        </Link>

        {/* Supabase Status Indicator */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></span>
          <span className="text-muted-foreground">
            {isSupabaseConfigured ? 'Supabase Bağlı' : 'Yerel Demo Modu'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto py-10">
        <div className="bg-[#111113] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="font-sans font-extrabold tracking-wider text-4xl text-foreground select-none mb-2">
              UĞRA<span className="text-primary">.</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {isSignUp ? 'İşletmenizi kaydedin ve ürün satmaya başlayın' : 'İşletme Giriş Paneli'}
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-xl p-3 mb-6 leading-relaxed">
              <strong>Geliştirici Notu:</strong> Supabase henüz yapılandırılmadı. Herhangi bir e-posta adresi ve şifreyle doğrudan <strong>Giriş Yap</strong> butonuna tıklayarak demo paneli test edebilirsiniz!
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    İşletme Adı
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder="Örn: Arkaplan Coffee"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Mağaza Adresi / Link</span>
                    <span className="text-[10px] text-primary lowercase normal-case">ugra.app/{slug || 'link'}</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60" />
                    <input
                      type="text"
                      placeholder="arkaplan-coffee"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-Posta Adresi
              </label>
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

            {/* Password */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm mt-6 shadow-lg shadow-primary/15"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Kayıt Ol ve Mağaza Aç
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Toggle Login / SignUp */}
          <div className="text-center mt-6 text-sm">
            <span className="text-muted-foreground">
              {isSignUp ? 'Zaten bir mağazanız var mı?' : 'UĞRA Partner\'a katılmak ister misiniz?'}
            </span>{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary font-semibold hover:underline cursor-pointer ml-1"
            >
              {isSignUp ? 'Giriş Yap' : 'Hemen Kaydol'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-muted-foreground/50 py-4">
        © 2026 UĞRA Teknolojileri A.Ş. Tüm hakları saklıdır.
      </div>
    </div>
  );
}
