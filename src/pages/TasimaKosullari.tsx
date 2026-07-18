import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ArrowLeft, Info } from 'lucide-react';
import { Link } from 'wouter';

export function TasimaKosullari() {
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const allowedItems = [
    'Evrak teslimi',
    'Paket teslimi',
    'Çiçek ve hediye alımı',
    'Market alışverişi',
    'Yedek parça alımı',
    'Unutulan eşya teslimi',
    'Mağaza alışverişi',
    'Hazır sipariş teslim alma',
    'Diğer yasal kişisel asistanlık hizmetleri'
  ];

  const prohibitedItems = [
    'Uyuşturucu ve uyarıcı maddeler',
    'Ruhsatsız silah ve mühimmat',
    'Patlayıcı maddeler',
    'Kaçak ürünler',
    'Sahte belge veya resmi evrakta sahtecilik kapsamındaki işlemler',
    'Çalıntı olduğu değerlendirilen ürünler',
    'Kanunen taşınması veya temin edilmesi yasak olan ürünler',
    'Türkiye Cumhuriyeti kanunlarına aykırı tüm talepler'
  ];

  const reservedRights = [
    'Talebi reddetme',
    'Hizmeti durdurma',
    'Siparişi iptal etme',
    'Yasal zorunluluk halinde ilgili resmi kurumlarla iş birliği yapma'
  ];

  return (
    <div className="min-h-screen w-full bg-background selection:bg-primary/30 selection:text-primary-foreground font-sans relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute top-40 left-10 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <Header />

      <main className="container mx-auto px-6 md:px-12 pt-32 pb-20 relative z-10 max-w-4xl">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Taşıma Koşulları<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl text-base md:text-lg font-light">
            UĞRA, şehir içi zaman asistanı olarak yalnızca yasal sınırlar içerisinde kalan taleplere aracılık eder.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Section 1: Allowed Items */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-panel rounded-[2rem] p-6 md:p-8 border border-white/5 bg-white/[0.01]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Giriş ve Kabul Edilen Talepler</h2>
            </div>
            
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
              UĞRA aracılığıyla aşağıdaki yasal hizmetler ve teslimatlar güvenle gerçekleştirilebilir:
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allowedItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2.5 text-sm text-muted-foreground bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Section 2: Prohibited Items */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-panel rounded-[2rem] p-6 md:p-8 border border-white/5 bg-white/[0.01]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-[#FF7A00]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Kabul Edilmeyen Talepler</h2>
            </div>

            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
              Aşağıdaki kategorilerde yer alan veya benzeri talepler hiçbir koşulda <span className="text-[#FF7A00] font-semibold">kabul edilmez</span>:
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prohibitedItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] shrink-0 mt-2" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Section 3: Reserved Rights and Liabilities */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-panel rounded-[2rem] p-6 md:p-8 border border-white/5 bg-white/[0.01] space-y-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">UĞRA'nın Hak ve Yetkileri</h2>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                UĞRA gerekli gördüğü durumlarda aşağıdaki haklarını saklı tutar:
              </p>
            </div>

            <ul className="space-y-2.5">
              {reservedRights.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground pl-1">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-white/5 text-xs md:text-sm text-muted-foreground/80 leading-relaxed italic">
              "Kullanıcı, oluşturduğu talebin tamamen yasal olduğunu ve doğabilecek tüm hukuki sorumluluğun kendisine ait olduğunu kabul eder."
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
