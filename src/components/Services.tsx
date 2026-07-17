import React from 'react';
import { motion } from 'framer-motion';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

const services = [
  "Önemli Evrak & Dosya",
  "Anahtar Teslimatı",
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
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground font-light max-w-xl mx-auto"
          >
            Senin için UĞRA'yalım.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, i) => (
            <InteractiveCard
              key={service}
              delay={i * 0.05}
              onClick={() => onServiceClick(service)}
              className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center group cursor-pointer h-full border border-white/5 transition-all duration-300 relative overflow-hidden"
              hoverBgColor="rgba(255, 255, 255, 0.04)"
              hoverBorderColor="rgba(235, 104, 33, 0.4)"
              hoverShadow="0 20px 40px -10px rgba(235, 104, 33, 0.15), inset 0 1px 0 0 rgba(255,255,255,0.05)"
            >
              {/* Subtle highlight gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300 relative z-10 flex items-center justify-center gap-2 w-full break-words">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300 flex-shrink-0" />
                <span className="text-center">{service}</span>
              </span>
            </InteractiveCard>
          ))}
        </div>
      </div>
    </section>
  );
}
