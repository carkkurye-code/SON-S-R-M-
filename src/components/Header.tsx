import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'wouter';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

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

      {/* Right to Left Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Clickable Backdrop below/beside the drawer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col justify-center items-center shadow-[-10px_0_40px_rgba(0,0,0,0.5)] border-l border-white/10 w-[85%] sm:w-[70%] md:w-[50%] lg:w-[35%] xl:w-[28%] max-w-[440px] h-full"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 md:top-8 md:right-8 text-muted-foreground hover:text-foreground transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto w-full">
                {/* UĞRA. Logo */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                  transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-12 h-[2px] bg-[#FF7A00] mb-5 rounded-full"
                />

                {/* Subtitle */}
                <motion.p
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-xs select-none"
                >
                  Zamanın sana kalsın.
                </motion.p>

                {/* Spacer / Margin */}
                <div className="h-8" />

                {/* PWA Install Action */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                    }}
                    className="w-full max-w-[240px] px-6 py-2.5 border border-white/10 rounded-full hover:bg-[#FF7A00]/10 hover:border-[#FF7A00] hover:text-[#FF7A00] text-sm font-semibold tracking-wider transition-all uppercase cursor-pointer text-center"
                  >
                    Uygulamayı Yükle
                  </button>

                  <Link href="/partner/login" onClick={() => setIsOpen(false)} className="w-full max-w-[240px]">
                    <span className="w-full block px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-sm font-semibold tracking-wider transition-all uppercase cursor-pointer text-center">
                      İşletme Paneli
                    </span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
