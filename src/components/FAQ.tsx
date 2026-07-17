import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "UĞRA nedir?",
    answer: "UĞRA., şehir içi günlük işlerinizi, teslimat ve organize edilmesi gereken her türlü görevi sizin yerinize halleden profesyonel bir kişisel zaman asistanlığı servisidir."
  },
  {
    question: "Hemen Uğra ile Geçerken Uğra arasındaki temel fark nedir?",
    answer: "Hemen UĞRA., saniyelerin ve dakikaların kritik olduğu durumlar içindir. Size özel atanan asistanımız doğrudan adresinize gelerek görevinizi kesintisiz yerine getirir. Geçerken UĞRA ise aciliyeti olmayan, gün içinde halledilmesi yeterli işleriniz içindir. Zaten o rotada seyahat eden bir asistanımız görevi üstlenir."
  },
  {
    question: "Nasıl çalışır?",
    answer: "Uygulama üzerinden talebinizi oluşturursunuz. En uygun asistanımız görevi üstlenir ve işinizi tamamlar."
  },
  {
    question: "Hangi işleri yapıyor?",
    answer: "Evrak tesliminden mağaza paket alımına, anahtar ulaştırmadan unutulan eşya getirmeye kadar her türlü şehir içi küçük operasyonu kapsar."
  },
  {
    question: "Sabit fiyat mı?",
    answer: "Evet. Sürpriz ücretlendirmeler yoktur, mesafeye ve işin niteliğine göre önceden belirlenen şeffaf ve sabit bir fiyat uygulanır."
  },
  {
    question: "Nasıl ödeme yapıyorum?",
    answer: "Ödeme, hizmet tamamlandıktan sonra nakit veya havale/EFT ile alınmaktadır."
  },
  {
    question: "Asistan nasıl olunur?",
    answer: "Menüdeki 'Asistan Ol' bölümünden başvurunuzu iletebilir, kısa bir değerlendirmenin ardından ekibimize katılabilirsiniz."
  }
];

export function FAQ() {
  return (
    <section className="py-24 relative z-10 border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12 max-w-3xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Sıkça Sorulan Sorular
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full gap-4 flex flex-col">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                whileHover={{ 
                  y: -4, 
                  scale: 1.01,
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
                }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden"
              >
                <AccordionItem 
                  value={`item-${i}`} 
                  className="border border-white/10 glass-panel rounded-2xl px-6 data-[state=open]:border-primary/30 transition-all duration-300"
                >
                  <AccordionTrigger className="hover:no-underline text-left text-lg md:text-xl py-6 data-[state=open]:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
