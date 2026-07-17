import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Services } from '@/components/Services';
import { BookingDialog, ActiveRequest } from '@/components/Features';
import { BecomeAssistant } from '@/components/BecomeAssistant';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleServiceClick = (service: string) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (newRequest: ActiveRequest) => {
    // Just a placeholder callback for the dialog success if needed
  };

  return (
    <div className="min-h-screen w-full bg-background selection:bg-primary/30 selection:text-primary-foreground font-sans">
      <Header />
      
      <main>
        <Hero />
        
        <Services onServiceClick={handleServiceClick} />
        
        <BecomeAssistant />
        <FAQ />
      </main>

      <Footer />

      {/* Dynamic Booking Flow Dialog */}
      <BookingDialog 
        isOpen={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
        selectedService={selectedService} 
        onSuccess={handleBookingSuccess} 
      />
    </div>
  );
}
