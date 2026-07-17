import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'wouter';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);

  return (
    <>
      <header 
        className="absolute top-0 left-0 right-0 z-50 safe-top py-6 bg-transparent"
      >
        <div className="container mx-auto px-5 sm:px-6 md:px-12 flex justify-between items-center">
          {/* Brand Mark */}
          <Link href="/" className="group flex items-center gap-3 z-50 relative cursor-pointer">
            <img 
              src="/favicon.svg" 
              alt="UĞRA Logo" 
              className="w-10 h-10 object-contain" 
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-2xl font-bold tracking-wider text-foreground group-hover:text-primary transition-colors">
                UĞRA<span className="text-primary">.</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                Şehir İçi Zaman Asistanınız
              </span>
            </div>
          </Link>

          {/* Hamburger Menu Icon */}
          <button 
            onClick={() => setIsOpen(true)}
            className="text-foreground hover:text-primary transition-colors z-50 relative p-2 -mr-2"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col justify-center items-center"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 md:top-8 md:right-12 text-muted-foreground hover:text-foreground transition-colors p-2"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
              {/* UĞRA. Logo */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <h2 className="text-5xl md:text-6xl font-bold tracking-widest text-foreground select-none">
                  UĞRA<span className="text-[#FF7A00]">.</span>
                </h2>
              </motion.div>

              {/* Centered thin short orange divider line */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-12 h-[2px] bg-[#FF7A00] mb-5 rounded-full"
              />

              {/* Subtitle */}
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-xs md:max-w-md select-none"
              >
                Zamanın sana kalsın.
              </motion.p>

              {/* Spacer / Margin */}
              <div className="h-8" />

              {/* Partner Ol Action */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-1.5"
              >
                <button
                  onClick={() => setShowPartnerInfo(true)}
                  className="text-foreground hover:text-[#FF7A00] text-sm font-semibold tracking-wider transition-colors uppercase cursor-pointer"
                >
                  Partner Ol
                </button>
                <span className="text-xs text-muted-foreground font-medium select-none">
                  Yakında
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partner Info Card Popup */}
      <AnimatePresence>
        {showPartnerInfo && (
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
              {/* Subtle background gradient overlay */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#FF7A00]/5 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xl font-bold text-foreground mb-4 relative z-10 select-none">
                Partner Programı
              </h3>
              
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 select-none relative z-10">
                UĞRA Partner Programı çok yakında yayında.<br />
                Mağazanı sisteme ekleyerek daha fazla müşteriye ulaşabileceksin.
              </p>

              <button
                onClick={() => setShowPartnerInfo(false)}
                className="relative z-10 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#FF7A00] hover:bg-[#E06B00] active:scale-95 transition-all rounded-lg shadow-lg shadow-[#FF7A00]/20 cursor-pointer"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
