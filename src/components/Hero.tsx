import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, MapPin } from 'lucide-react';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

const messages = [
  "Gömleğimi kuru temizlemeye bırakabilir misin?",
  "Çiçek bırakabilir misin?",
  "Anahtarımı getirebilir misin?",
  "Eczaneye uğrayabilir misin?",
  "Hediyemi teslim edebilir misin?",
  "Evrak teslim edebilir misin?"
];

const bullets = [
  "Senin yerine uğrar.",
  "Hazır olanı teslim alır, teslim eder.",
  "Sabit fiyat, sürpriz yok."
];

function Typewriter() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentMessage = messages[messageIndex];
    let typingSpeed = isDeleting ? 30 : 70;

    if (!isDeleting && displayedText === currentMessage) {
      setTimeout(() => setIsDeleting(true), 2000);
      return;
    }

    if (isDeleting && displayedText === "") {
      setIsDeleting(false);
      setMessageIndex((prev) => (prev + 1) % messages.length);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText(prev => 
        isDeleting 
          ? currentMessage.substring(0, prev.length - 1)
          : currentMessage.substring(0, prev.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, messageIndex]);

  return (
    <span className="text-foreground">
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-1.5 h-5 bg-primary ml-1 align-middle"
      />
    </span>
  );
}

function RotatingBullets() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % bullets.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-6 relative overflow-hidden mt-6 flex justify-center lg:justify-start lg:pl-4 items-center text-sm md:text-base text-muted-foreground font-medium">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-[0_0_6px_rgba(235,104,33,0.6)] animate-pulse" />
          <span>{bullets[index]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ServiceAreaPill() {
  const areas = ["Adapazarı", "Serdivan", "Erenler"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % areas.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium border-white/5 shadow-lg h-9 overflow-hidden">
      <MapPin className="w-4 h-4 text-primary shrink-0" />
      <div className="relative w-24 h-5 overflow-hidden inline-flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute left-0 text-foreground font-medium"
          >
            {areas[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Hero() {
  const [isPartnerHovered, setIsPartnerHovered] = useState(false);
  const [isMarketHovered, setIsMarketHovered] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);

  return (
    <section className="min-h-[100dvh] pt-32 pb-16 flex flex-col justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10 relative">
        
        {/* Left Side: Typography & Input */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-foreground mb-6"
          >
            UĞRA<span className="text-primary">.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light max-w-2xl mb-8 sm:mb-12"
          >
            Gitmeye vakit bulamadığın her yere senin için <span className="text-foreground font-medium">UĞRA'yalım.</span>
          </motion.p>
 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl mx-auto lg:mx-0 flex flex-col items-center lg:items-start"
          >
            {/* Fake Input */}
            <div className="w-full glass-panel rounded-2xl p-4 md:p-5 flex items-center gap-4 cursor-default border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
              <div className="flex-1 text-left overflow-hidden min-h-[28px] text-lg md:text-xl font-medium">
                <Typewriter />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 opacity-50">
                <ArrowUpCircle className="w-5 h-5 text-white/50" />
              </div>
            </div>
 
            <div className="mt-6">
              <ServiceAreaPill />
            </div>
 
            <div className="w-full max-w-sm">
              <RotatingBullets />
            </div>
          </motion.div>
        </div>
 
        {/* Right Side: Cards */}
        <div className="lg:col-span-5 relative h-[400px] md:h-[500px] w-full max-w-md mx-auto perspective-1000">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col justify-center items-center gap-6"
          >
            {/* Uğra Market Card */}
            <InteractiveCard 
              animateOnScroll={false}
              active={true}
              hoverBorderColor="rgba(235, 104, 33, 0.4)"
              hoverShadow="0 30px 60px -15px rgba(235, 104, 33, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.15)"
              onMouseEnter={() => setIsMarketHovered(true)}
              onMouseLeave={() => setIsMarketHovered(false)}
              onClick={() => setShowMarketModal(true)}
              className={`glass-panel rounded-[2rem] p-6 flex justify-between items-center cursor-pointer transition-all duration-500 relative overflow-hidden group ${
                isMarketHovered 
                  ? "w-full z-30 opacity-100 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] bg-gradient-to-br from-white/[0.08] to-transparent" 
                  : "w-[95%] z-20 opacity-80 border border-white/5 shadow-none bg-white/[0.02]"
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
              <div className="flex items-center gap-3 relative z-10">
                <span className={`w-2.5 h-2.5 rounded-full bg-[#FF7A00] flex-shrink-0 transition-all duration-300 ${isMarketHovered ? "animate-pulse opacity-100" : "opacity-70"}`} />
                <div className={`transition-all duration-300 ${isMarketHovered ? "font-bold text-xl tracking-wide text-foreground" : "font-semibold text-lg text-muted-foreground"}`}>UĞRA MARKET</div>
              </div>
              <div className="relative h-7 flex items-center justify-end z-10">
                <AnimatePresence mode="wait">
                  {isMarketHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 py-1 rounded-full bg-[#FF7A00]/20 text-[#FF7A00] text-xs font-bold uppercase tracking-wider border border-[#FF7A00]/30"
                    >
                      Çok Yakında
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </InteractiveCard>
 
            {/* Uğra Partner Card */}
            <InteractiveCard 
              animateOnScroll={false}
              active={true}
              hoverBorderColor="rgba(235, 104, 33, 0.4)"
              hoverShadow="0 30px 60px -15px rgba(235, 104, 33, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.15)"
              onMouseEnter={() => setIsPartnerHovered(true)}
              onMouseLeave={() => setIsPartnerHovered(false)}
              onClick={() => setShowPartnerModal(true)}
              className={`glass-panel rounded-[2rem] p-6 flex justify-between items-center cursor-pointer transition-all duration-500 relative overflow-hidden group ${
                isPartnerHovered 
                  ? "w-full z-30 opacity-100 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)] bg-gradient-to-br from-white/[0.08] to-transparent" 
                  : "w-[95%] z-20 opacity-80 border border-white/5 shadow-none bg-white/[0.02]"
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
              <div className="flex items-center gap-3 relative z-10">
                <span className={`w-2.5 h-2.5 rounded-full bg-[#FF7A00] flex-shrink-0 transition-all duration-300 ${isPartnerHovered ? "animate-pulse opacity-100" : "opacity-70"}`} />
                <div className={`transition-all duration-300 ${isPartnerHovered ? "font-bold text-xl tracking-wide text-foreground" : "font-semibold text-lg text-muted-foreground"}`}>UĞRA PARTNER</div>
              </div>
              <div className="relative h-7 flex items-center justify-end z-10">
                <AnimatePresence mode="wait">
                  {isPartnerHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 py-1 rounded-full bg-[#FF7A00]/20 text-[#FF7A00] text-xs font-bold uppercase tracking-wider border border-[#FF7A00]/30"
                    >
                      Çok Yakında
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>
 
      </div>

      {/* Hero Partner Modal */}
      <AnimatePresence>
        {showPartnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card border border-border max-w-md w-full rounded-2xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#FF7A00]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#FF7A00] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 relative z-10 select-none">
                Partner Programı
              </h3>
              
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 select-none relative z-10">
                UĞRA Partner Programı çok yakında yayında.<br />
                Mağazanı sisteme ekleyerek daha fazla müşteriye ulaşabileceksin.
              </p>

              <button
                onClick={() => setShowPartnerModal(false)}
                className="relative z-10 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#FF7A00] hover:bg-[#E06B00] active:scale-95 transition-all rounded-lg shadow-lg shadow-[#FF7A00]/20 cursor-pointer"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Market Modal */}
      <AnimatePresence>
        {showMarketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card border border-border max-w-md w-full rounded-2xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#FF7A00]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-center mb-4">
                <span className="w-3 h-3 rounded-full bg-[#FF7A00] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 relative z-10 select-none">
                UĞRA Market
              </h3>
              
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 select-none relative z-10">
                UĞRA Market çok yakında sizlerle!<br />
                Kendi güvencemiz altında satışa sunulacak tüm orijinal ürünlerimize doğrudan bu platformdan ulaşıp güvenle satın alabileceksiniz.
              </p>

              <button
                onClick={() => setShowMarketModal(false)}
                className="relative z-10 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#FF7A00] hover:bg-[#E06B00] active:scale-95 transition-all rounded-lg shadow-lg shadow-[#FF7A00]/20 cursor-pointer"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
