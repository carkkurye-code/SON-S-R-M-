import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Bell,
  BellRing
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { getPushStatus, subscribeToPushNotifications, PushStatus } from '@/lib/push-notifications';

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
  const [stage, setStage] = useState<'choice' | 'consent' | 'success'>('choice');
  const [selectedType, setSelectedType] = useState<'hemen' | 'gecerken' | null>(null);
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [localService, setLocalService] = useState<string>('Listede Olmayan İşler');

  useEffect(() => {
    if (selectedService) {
      setLocalService(selectedService);
    }
  }, [selectedService]);

  useEffect(() => {
    if (isOpen) {
      getPushStatus().then(setPushStatus);
    }
  }, [isOpen]);

  const handleSubscribePush = async () => {
    setIsSubscribingPush(true);
    const result = await subscribeToPushNotifications();
    setPushStatus(result);
    setIsSubscribingPush(false);
  };

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
      setIsConsentChecked(false);
    }
  }, [isOpen, selectedService]);

  const handleSelectType = (type: 'hemen' | 'gecerken') => {
    setSelectedType(type);
    setStage('consent');
  };

  const handleConfirmConsent = () => {
    if (!selectedType || !isConsentChecked) return;
    setIsSubmitting(true);

    const serviceName = localService || 'Listede Olmayan İşler';
    const deliveryTypeLabel = selectedType === 'hemen' ? 'Hemen UĞRA' : 'Geçerken UĞRA';

    const messageText =
      `Merhaba UĞRA.\n\n` +
      `Yeni bir hizmet talebi oluşturmak istiyorum.\n\n` +
      `• Teslimat Tipi\n` +
      `${deliveryTypeLabel}\n\n` +
      `• Hizmet\n` +
      `${serviceName}\n\n` +
      `Hizmet koşullarını okudum ve kabul ediyorum.\n\n` +
      `Müsait olduğunuzda beni arayabilirsiniz.`;

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
        type: selectedType,
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
      <DialogContent 
        hideClose={stage === 'success'} 
        className={`${stage === 'success' ? 'w-[85%] max-w-[360px] bg-white border-none shadow-[0_12px_40px_rgba(0,0,0,0.08)] text-[#111111] rounded-[20px] p-6' : 'w-full sm:max-w-[500px] bg-card border-white/10 text-foreground rounded-[2rem] p-6 md:p-8'} max-h-[90vh] overflow-y-auto transition-all duration-300`}
      >
        
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
                  <span className="text-foreground font-semibold">"{localService}"</span> işiniz için zaman ve fiyat modelini seçin.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Hemen UĞRA Card */}
                <InteractiveCard
                  animateOnScroll={false}
                  onClick={() => !isSubmitting && handleSelectType('hemen')}
                  active={!isSubmitting}
                  hoverBorderColor="rgba(235, 104, 33, 0.4)"
                  hoverShadow="0 20px 40px -10px rgba(235, 104, 33, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.1)"
                  className={`glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px] ${isSubmitting ? 'pointer-events-none opacity-55' : ''}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full group-hover:bg-primary/20 pointer-events-none" />
                  
                  {/* Fiyat Rozeti */}
                  <div className="absolute top-3.5 right-2 bg-black/60 backdrop-blur-md border border-primary/40 px-2.5 py-1 rounded-full text-[11px] font-bold text-primary tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all">
                    390 TL
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
                  onClick={() => !isSubmitting && handleSelectType('gecerken')}
                  active={!isSubmitting}
                  hoverBorderColor="rgba(255, 255, 255, 0.2)"
                  hoverShadow="0 20px 40px -10px rgba(255, 255, 255, 0.05), inset 0 1px 0 0 rgba(255,255,255,0.1)"
                  className={`glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px] ${isSubmitting ? 'pointer-events-none opacity-55' : ''}`}
                >
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full pointer-events-none" />
                  
                  {/* Fiyat Rozeti */}
                  <div className="absolute top-3.5 right-2 bg-black/60 backdrop-blur-md border border-primary/40 px-2.5 py-1 rounded-full text-[11px] font-bold text-primary tracking-wider uppercase z-20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all">
                    290 TL
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

          {/* STAGE: CONSENT */}
          {stage === 'consent' && (
            <motion.div
              key="consent-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] shadow-[0_0_12px_rgba(255,122,0,0.8)] flex-shrink-0" />
                  Hizmet Onayı
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Lütfen devam etmeden önce aşağıdaki kuralları ve hizmet koşullarını onaylayın.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm space-y-4 max-h-[250px] overflow-y-auto leading-relaxed select-none text-muted-foreground">
                <p>
                  UĞRA yalnızca Türkiye Cumhuriyeti kanunlarına uygun talepleri yerine getirir.
                </p>
                <p>
                  Talebimin yasa dışı herhangi bir işlem, ürün veya hizmet içermediğini, aksi durumda doğabilecek tüm hukuki ve cezai sorumluluğun tarafıma ait olduğunu kabul ediyorum.
                </p>
                <p>
                  UĞRA, gerekli gördüğü durumlarda talebi reddetme, hizmeti durdurma ve yasal zorunluluk halinde ilgili resmi kurumlarla iş birliği yapma hakkını saklı tutar.
                </p>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none group text-sm font-medium">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isConsentChecked}
                      onChange={(e) => setIsConsentChecked(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border border-white/20 rounded-md bg-white/[0.02] peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                    Okudum, anladım ve kabul ediyorum.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStage('choice')}
                  className="flex-1 py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-wider bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition-all text-muted-foreground border border-white/5 cursor-pointer"
                >
                  Geri
                </button>
                <button
                  onClick={handleConfirmConsent}
                  disabled={!isConsentChecked || isSubmitting}
                  className="flex-[2] py-3.5 px-6 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-primary hover:bg-[#E06B00] disabled:opacity-40 disabled:pointer-events-none disabled:bg-primary/50 shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> İletiliyor...
                    </>
                  ) : (
                    <>
                      WhatsApp ile Devam Et →
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: SUCCESS */}
          {stage === 'success' && (
            <motion.div
              key="success-stage"
              className="flex flex-col items-center justify-center text-center py-4 space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* BRAND LOGO */}
              <div className="font-sans font-extrabold tracking-wider text-3xl text-[#111111] select-none text-center">
                UĞRA<span className="text-[#F97316]">.</span>
              </div>
              
              {/* HEADER */}
              <h3 className="text-[22px] font-bold text-[#111111] tracking-tight text-center">
                Talebiniz Alındı
              </h3>

              {/* PRIMARY SUBTEXT */}
              <p className="text-[15px] font-normal text-[#6B7280] leading-relaxed text-center">
                Asistanımız talebinizi aldı.<br />
                En kısa sürede sizinle iletişime geçecektir.
              </p>

              {/* DIVIDER 1 */}
              <div className="w-full border-t border-gray-100 my-1"></div>

              {/* SECONDARY INFO */}
              <p className="text-[13px] font-normal text-gray-400 leading-relaxed text-center">
                Lütfen telefonunuzu açık ve<br />
                ulaşılabilir durumda tutunuz.
              </p>

              {/* DIVIDER 2 */}
              <div className="w-full border-t border-gray-100 my-1"></div>

              {/* Notification Banner/Card for PWA */}
              {pushStatus && pushStatus.supported && (
                <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-1 text-left flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] shrink-0">
                    {pushStatus.permission === 'granted' ? (
                      <BellRing className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {pushStatus.permission === 'granted' 
                        ? 'Bildirimler Aktif' 
                        : 'Sipariş Durumu Bildirimleri'}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {pushStatus.permission === 'granted'
                        ? 'Siparişiniz yola çıktığında ve teslim edildiğinde sizi anlık bilgilendireceğiz.'
                        : 'Asistanınız yola çıktığında veya işiniz tamamlandığında anlık bildirim almak ister misiniz?'}
                    </p>
                    {pushStatus.permission === 'default' && (
                      <button
                        onClick={handleSubscribePush}
                        disabled={isSubscribingPush}
                        className="mt-3 text-xs bg-[#F97316] hover:bg-[#ea580c] text-white font-bold px-4 py-2 rounded-lg transition-colors duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {isSubscribingPush ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        Bildirimleri İzin Ver
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                onClick={() => onOpenChange(false)}
                className="w-full h-[50px] bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-[16px] transition-colors duration-300 ease-out active:scale-[0.98] cursor-pointer text-base shadow-sm"
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
