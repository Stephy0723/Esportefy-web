import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="relative py-32 px-6 bg-[var(--bg-page)] overflow-hidden">
      {/* Animated background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[var(--primary)] rounded-full blur-[300px] opacity-[0.04]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#4FACFE] rounded-full blur-[200px] opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F093FB] rounded-full blur-[200px] opacity-[0.03]" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <span className="text-[var(--primary)] uppercase tracking-[0.3em] text-xs font-bold">
          &Uacute;nete hoy
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold text-[var(--text-main)] mt-4 mb-6 leading-tight">
          &iquest;Listo para competir <br />
          <span className="text-[var(--primary)]">como profesional?</span>
        </h2>
        <p className="text-[var(--text-muted)] text-lg mb-12 max-w-lg mx-auto">
          Crea tu cuenta gratis, arma tu equipo y demuestra que tienes
          lo que se necesita para llegar al top.
        </p>

        <div className="flex flex-wrap justify-center gap-5">
          <Link
            to="/register"
            className="px-10 py-4 bg-[var(--primary)] text-black font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[var(--primary-hover)] transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_rgba(142,219,21,0.35)] hover:shadow-[0_0_50px_rgba(142,219,21,0.55)]"
          >
            <span className="flex items-center gap-2">
              <i className="bx bx-rocket text-lg"></i>
              Crear Cuenta Gratis
            </span>
          </Link>
          <Link
            to="/torneos"
            className="px-10 py-4 border-2 border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[var(--bg-card-hover)] hover:border-[var(--text-muted)] transition-all duration-300 hover:-translate-y-1"
          >
            <span className="flex items-center gap-2">
              <i className="bx bx-trophy text-lg"></i>
              Explorar Torneos
            </span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default CallToAction;
