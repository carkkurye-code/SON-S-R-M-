import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Home } from '@/pages/Home';
import { TasimaKosullari } from '@/pages/TasimaKosullari';
import { PartnerDashboard } from '@/pages/PartnerDashboard';
import { AdminPanel } from '@/pages/AdminPanel';
import { StoreFront } from '@/pages/StoreFront';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B] text-foreground">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground">Sayfa bulunamadı.</p>
        <a href="/" className="mt-8 inline-block px-6 py-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tasima-kosullari" component={TasimaKosullari} />
      <Route path="/partner" component={PartnerDashboard} />
      <Route path="/partner/dashboard" component={PartnerDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/:slug" component={StoreFront} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
