import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

const services = [
  "Önemli Evrak & Dosya",
  "Yedek Parça",
  "Çiçek & Hediye Gönderimi",
  "Paket & Eşya Taşıma",
  "Mağaza & Alışveriş Siparişi",
  "Unutulan Eşya Getirme",
  "Esnaf & Dükkan İşleri",
  "Listede Olmayan İşler"
];

interface ServicesProps {
  onServiceClick: (service: string) => void;
}

export function Services({ onServiceClick }: ServicesProps) {
  const [index, setIndex] = useState(0);
  const texts = ["Senin için UĞRA'yalım", "Senin yerine UĞRA'yalım"];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 relative z-10 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          >
            UĞRA<span className="text-primary">.</span>
          </motion.h2>
          <div className="h-8 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex items-center gap-2 text-lg md:text-xl text-muted-foreground font-light"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 shadow-[0_0_8px_rgba(235,104,33,0.6)] animate-pulse" />
                <span>{texts[index]}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {services.map((service, i) => (
            <InteractiveCard
              key={service}
              delay={i * 0.05}
              onClick={() => onServiceClick(service)}
              className="glass-card rounded-2xl p-3.5 sm:p-6 flex flex-col items-center justify-center text-center group cursor-pointer h-full border border-white/5 transition-all duration-300 relative overflow-hidden"
              hoverBgColor="rgba(255, 255, 255, 0.04)"
              hoverBorderColor="rgba(235, 104, 33, 0.4)"
              hoverShadow="0 20px 40px -10px rgba(235, 104, 33, 0.15), inset 0 1px 0 0 rgba(255,255,255,0.05)"
            >
              {/* Subtle highlight gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="text-sm sm:text-base font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300 relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 w-full break-words">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300 flex-shrink-0" />
                <span className="text-center leading-snug">{service}</span>
              </span>
            </InteractiveCard>
          ))}
        </div>
      </div>
    </section>
  );
}
