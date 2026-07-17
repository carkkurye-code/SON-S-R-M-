import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

export interface ActiveRequest {
  type: 'hemen' | 'gecerken';
  from?: string;
  to?: string;
  details: string;
  name?: string;
  phone?: string;
  status: 'pending' | 'assigned' | 'transit' | 'delivered';
  createdAt: number;
}

interface BookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedService: string | null;
  onSuccess: (request: ActiveRequest) => void;
}

export function BookingDialog({ isOpen, onOpenChange, selectedService, onSuccess }: BookingDialogProps) {
  const [stage, setStage] = useState<'choice' | 'success'>('choice');
  const [selectedType, setSelectedType] = useState<'hemen' | 'gecerken' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset internal stage when dialog opens with a new service
  useEffect(() => {
    if (isOpen) {
      setStage('choice');
      setSelectedType(null);
    }
  }, [isOpen, selectedService]);

  const handleChooseType = (type: 'hemen' | 'gecerken') => {
    setSelectedType(type);
    setIsSubmitting(true);

    const now = new Date();
    const serviceName = selectedService || 'Genel Zaman Asistanlığı';
    const deliveryTypeLabel = type === 'hemen' ? 'Hemen UĞRA' : 'Geçerken UĞRA';

    const messageText =
      `Merhaba.\n\n` +
      `UĞRA üzerinden yeni bir asistan talebi oluşturdum.\n\n` +
      `Hizmet:\n${serviceName}\n\n` +
      `Tercih:\n${deliveryTypeLabel}\n\n` +
      `Asistanımız en kısa sürede sizi arayacaktır.`;

    // WhatsApp Number (changeable by the user, country code + number)
    const WHATSAPP_NUMBER = "905394659154";
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;

    // Try to open WhatsApp in a new tab/window
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error("WhatsApp redirection failed:", e);
    }

    setTimeout(() => {
      const newRequest: ActiveRequest = {
        type: type,
        details: serviceName,
        status: 'pending',
        createdAt: Date.now(),
      };

      onSuccess(newRequest);
      setIsSubmitting(false);
      setStage('success');
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground rounded-[2rem] p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        
        <AnimatePresence mode="wait">
          
          {/* STAGE 1: CHOICE BETWEEN HEMEN / GECERKEN */}
          {stage === 'choice' && (
            <motion.div
              key="choice-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  Uğra Teslimat Tipi
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  <span className="text-foreground font-semibold">"{selectedService}"</span> işiniz için zaman ve fiyat modelini seçin.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Hemen UĞRA Card */}
                <InteractiveCard
                  animateOnScroll={false}
                  onClick={() => !isSubmitting && handleChooseType('hemen')}
                  active={!isSubmitting}
                  hoverBorderColor="rgba(235, 104, 33, 0.4)"
                  hoverShadow="0 20px 40px -10px rgba(235, 104, 33, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.1)"
                  className={`glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px] ${isSubmitting ? 'pointer-events-none opacity-55' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full group-hover:bg-primary/20 pointer-events-none" />
                  
                  {/* Fiyat Rozeti */}
                  <div className="absolute top-3.5 right-2 bg-black/60 backdrop-blur-md border border-primary/40 px-2.5 py-1 rounded-full text-[11px] font-bold text-primary tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all">
                    250 TL
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-2 flex items-center gap-1.5 text-foreground pr-20">
                      <span>⚡</span> Hemen UĞRA
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      En yakın asistan görevi hemen üstlenir. En hızlı teslimat yöntemi.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
                    {isSubmitting && selectedType === 'hemen' ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> İletiliyor...</span>
                    ) : (
                      <>Seç ve İlet <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </div>
                </InteractiveCard>

                {/* Geçerken UĞRA Card */}
                <InteractiveCard
                  animateOnScroll={false}
                  onClick={() => !isSubmitting && handleChooseType('gecerken')}
                  active={!isSubmitting}
                  hoverBorderColor="rgba(255, 255, 255, 0.2)"
                  hoverShadow="0 20px 40px -10px rgba(255, 255, 255, 0.05), inset 0 1px 0 0 rgba(255,255,255,0.1)"
                  className={`glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px] ${isSubmitting ? 'pointer-events-none opacity-55' : ''}`}
                >
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full pointer-events-none" />
                  
                  {/* Fiyat Rozeti */}
                  <div className="absolute top-3.5 right-2 bg-black/60 backdrop-blur-md border border-primary/40 px-2.5 py-1 rounded-full text-[11px] font-bold text-primary tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all">
                    200 TL
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-2 flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors pr-20">
                      <span>🔄</span> Geçerken UĞRA
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Aynı rotadaki asistan görevi ekonomik şekilde üstlenir. Gün içi esnek teslimat.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
                    {isSubmitting && selectedType === 'gecerken' ? (
                      <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> İletiliyor...</span>
                    ) : (
                      <>Seç ve İlet <ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </div>
                </InteractiveCard>

              </div>
            </motion.div>
          )}

          {/* STAGE 2: SUCCESS */}
          {stage === 'success' && (
            <motion.div
              key="success-stage"
              className="flex flex-col items-center justify-center text-center py-8 space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">✅ Talebiniz Alındı</h3>
                <div className="space-y-2 max-w-sm mx-auto">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Asistanımız sizi birkaç dakika içerisinde telefonla arayacaktır.
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    Lütfen telefonunuzu ulaşılabilir durumda tutunuz.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto min-w-[140px] mt-6 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm"
              >
                Tamam
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
