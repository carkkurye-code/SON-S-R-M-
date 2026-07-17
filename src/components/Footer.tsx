import React from 'react';

export function Footer() {
  return (
    <footer className="py-8 md:py-12 border-t border-white/5 relative z-10">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start text-sm text-muted-foreground">
          <span className="font-medium">© 2026 UĞRA<span className="text-primary">.</span></span>
          <span className="text-xs opacity-70 mt-1">Gökhan Gökalp</span>
        </div>
        
        <a 
          href="https://instagram.com/ugra.app" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Instagram
        </a>
      </div>
    </footer>
  );
}
