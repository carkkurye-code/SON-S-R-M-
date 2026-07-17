import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  animateOnScroll?: boolean;
  active?: boolean;
  hoverBorderColor?: string;
  hoverBgColor?: string;
  hoverShadow?: string;
}

export function InteractiveCard({
  children,
  className = '',
  onClick,
  delay = 0,
  animateOnScroll = true,
  active = true,
  hoverBorderColor,
  hoverBgColor,
  hoverShadow,
  ...props
}: InteractiveCardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const hoverStyle = active && !isMobile ? {
    y: -12,
    borderColor: hoverBorderColor || 'rgba(235, 104, 33, 0.4)',
    backgroundColor: hoverBgColor,
    boxShadow: hoverShadow || '0 20px 40px -10px rgba(235, 104, 33, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
  } : {};

  const tapStyle = active ? {
    scale: 0.95,
  } : {};

  const cardContent = (
    <motion.div
      whileHover={hoverStyle}
      whileTap={tapStyle}
      onClick={active ? onClick : undefined}
      className={className}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );

  if (animateOnScroll) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: delay, ease: "easeOut" }}
        className="h-full"
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
