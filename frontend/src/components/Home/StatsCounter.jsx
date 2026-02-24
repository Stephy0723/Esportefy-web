import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const STATS = [
  { label: 'Jugadores Activos', target: 15000, suffix: '+', icon: 'bx-user' },
  { label: 'Torneos Completados', target: 320, suffix: '+', icon: 'bx-trophy' },
  { label: 'Equipos Creados', target: 1200, suffix: '+', icon: 'bx-group' },
  { label: 'Juegos Soportados', target: 25, suffix: '+', icon: 'bx-joystick' },
];

/* ── Hook: animated count-up ── */
const useCountUp = (target, duration = 2200, shouldStart = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);

  return count;
};

/* ── Single Stat ── */
const StatItem = ({ stat, inView, index }) => {
  const count = useCountUp(stat.target, 2200, inView);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative group text-center p-6"
    >
      {/* Icon */}
      <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-[var(--primary-dim)] border border-[rgba(142,219,21,0.15)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <i className={`bx ${stat.icon} text-[28px] text-[var(--primary)]`}></i>
      </div>

      {/* Number */}
      <div className="text-4xl md:text-5xl font-extrabold text-[var(--text-main)] mb-2 tabular-nums tracking-tight">
        {count.toLocaleString()}{stat.suffix}
      </div>

      {/* Label */}
      <div className="text-[var(--text-muted)] text-xs uppercase tracking-[0.2em] font-semibold">
        {stat.label}
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--primary)] opacity-0 group-hover:opacity-60 group-hover:w-16 transition-all duration-500 rounded-full" />
    </motion.div>
  );
};

/* ── Section ── */
const StatsCounter = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 bg-[var(--bg-card)] border-y border-[var(--border-color)] overflow-hidden"
    >
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />

      {/* Centered glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)] rounded-full blur-[250px] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} inView={inView} index={i} />
        ))}
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />
    </section>
  );
};

export default StatsCounter;
