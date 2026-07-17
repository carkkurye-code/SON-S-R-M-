import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const assistants = [
  {
    icon: "🛵",
    title: "Motosiklet",
    status: "Başvurular Açık",
    active: true
  },
  {
    icon: "🚲",
    title: "Bisiklet",
    status: "Çok Yakında",
    active: false
  }
];

interface ApplicationFormData {
  fullName: string;
  phone: string;
  city: string;
  motorInfo: string;
  licenseInfo: string;
  experience: string;
  hasCompany: string;
  notes: string;
}

const initialFormData: ApplicationFormData = {
  fullName: '',
  phone: '',
  city: '',
  motorInfo: '',
  licenseInfo: '',
  experience: '',
  hasCompany: 'Evet',
  notes: ''
};

export function BecomeAssistant() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stage, setStage] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCardClick = (active: boolean) => {
    if (active) {
      setFormData(initialFormData);
      setStage('form');
      setIsDialogOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const WHATSAPP_NUMBER = "905394659154";
    const messageText = 
      `Merhaba.\n\n` +
      `Yeni bir Motosikletli Asistan Başvurusu alındı.\n\n` +
      `Ad Soyad:\n${formData.fullName}\n\n` +
      `Telefon:\n${formData.phone}\n\n` +
      `Şehir:\n${formData.city}\n\n` +
      `Motor Markası / Modeli:\n${formData.motorInfo}\n\n` +
      `Ehliyet:\n${formData.licenseInfo}\n\n` +
      `Deneyim:\n${formData.experience}\n\n` +
      `Şahıs Şirketi:\n${formData.hasCompany}\n\n` +
      `Ek Not:\n${formData.notes || '-'}`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;

    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error("WhatsApp redirection failed:", err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setStage('success');
    }, 800);
  };

  return (
    <section className="py-24 relative z-10 border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-[100%] pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Asistan Ol
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {assistants.map((item, i) => (
            <InteractiveCard
              key={item.title}
              delay={i * 0.1}
              active={item.active}
              onClick={() => handleCardClick(item.active)}
              className={`glass-panel rounded-[2rem] p-8 flex flex-col justify-between h-full w-full group transition-all duration-300 border border-white/5 relative overflow-hidden ${
                item.active ? 'cursor-pointer' : 'opacity-60 cursor-default'
              }`}
              hoverBorderColor="rgba(235, 104, 33, 0.3)"
              hoverShadow="0 25px 50px -12px rgba(235, 104, 33, 0.15), inset 0 1px 0 0 rgba(255,255,255,0.08)"
            >
              {/* Subtle spotlight glow */}
              {item.active && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
              )}

              <div className="flex justify-between items-start">
                <div className="text-5xl grayscale group-hover:grayscale-0 transition-all duration-500">
                  {item.icon}
                </div>
                {item.active && (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
                  item.active 
                    ? 'bg-primary/20 text-primary border-primary/30' 
                    : 'bg-white/5 text-muted-foreground border-white/10'
                }`}>
                  {item.status}
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>
      </div>

      {/* Motosiklet Asistanı Başvuru Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card border-white/10 text-foreground rounded-[2rem] p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {stage === 'form' ? (
              <motion.div
                key="apply-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    Motosikletli Asistan Başvurusu
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Aramıza katılmak için aşağıdaki başvuru formunu eksiksiz doldurun.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Adınız Soyadınız"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="05xx xxx xx xx"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Şehir
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Örn: İstanbul"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Motor Markası / Modeli
                      </label>
                      <input
                        type="text"
                        name="motorInfo"
                        required
                        value={formData.motorInfo}
                        onChange={handleInputChange}
                        placeholder="Örn: Honda Forza 250"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Ehliyet
                      </label>
                      <input
                        type="text"
                        name="licenseInfo"
                        required
                        value={formData.licenseInfo}
                        onChange={handleInputChange}
                        placeholder="Örn: A, A2"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Deneyim
                      </label>
                      <input
                        type="text"
                        name="experience"
                        required
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="Örn: 3 Yıl Kurye"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Şahıs Şirketiniz Var mı?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hasCompany: 'Evet' }))}
                        className={`flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                          formData.hasCompany === 'Evet'
                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(235,104,33,0.15)]'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                        }`}
                      >
                        Evet
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hasCompany: 'Hayır' }))}
                        className={`flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                          formData.hasCompany === 'Hayır'
                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(235,104,33,0.15)]'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                        }`}
                      >
                        Hayır
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Ek Not
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Varsa eklemek istedikleriniz..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        Başvuruyu Gönder
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
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
                  <h3 className="text-2xl font-bold text-foreground">Başvurunuz Alındı</h3>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Başvurunuz başarıyla tarafımıza ulaştı.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Uygun görülmesi halinde en kısa sürede sizinle iletişime geçeceğiz.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto min-w-[140px] mt-6 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm"
                >
                  Tamam
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
