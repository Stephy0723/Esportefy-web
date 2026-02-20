import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={scrollUp}
          aria-label="Volver arriba"
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-[var(--primary)] text-[var(--text-inverted)] flex items-center justify-center shadow-[0_0_20px_rgba(142,219,21,0.4)] hover:shadow-[0_0_30px_rgba(142,219,21,0.6)] hover:scale-110 transition-all duration-300 cursor-pointer"
        >
          <i className="bx bx-chevron-up text-2xl"></i>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
