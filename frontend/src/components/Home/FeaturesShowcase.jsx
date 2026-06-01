import React from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../../context/LanguageContext';

const FEATURES = (t) => [
  {
    icon: 'bx-trophy',
    title: t('featureTournamentsTitle'),
    desc: t('featureTournamentsDesc'),
    color: '#FFD700',
  },
  {
    icon: 'bx-group',
    title: t('featureTeamsTitle'),
    desc: t('featureTeamsDesc'),
    color: '#4FACFE',
  },
  {
    icon: 'bx-bar-chart-alt-2',
    title: t('featureRankingsTitle'),
    desc: t('featureRankingsDesc'),
    color: '#8EDB15',
  },
  {
    icon: 'bx-world',
    title: t('featureCommunitiesTitle'),
    desc: t('featureCommunitiesDesc'),
    color: '#F093FB',
  },
  {
    icon: 'bx-chat',
    title: t('featureChatTitle'),
    desc: t('featureChatDesc'),
    color: '#FF6B6B',
  },
  {
    icon: 'bx-medal',
    title: t('featureProfileTitle'),
    desc: t('featureProfileDesc'),
    color: '#FFA500',
  },
];

const FeaturesShowcase = () => {
  const { t } = useLang();
  const features = FEATURES(t);
  return (
    <section className="relative py-24 px-6 md:px-16 bg-[var(--bg-page)] overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[var(--primary)] rounded-full blur-[150px] -translate-y-1/2 opacity-[0.04]" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-[#4FACFE] rounded-full blur-[150px] -translate-y-1/2 opacity-[0.04]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[var(--primary)] uppercase tracking-[0.3em] text-xs font-bold">
            {t('featuresTagline')}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[var(--text-main)] mt-4 mb-6">
            {t('featuresHeading')}
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
            {t('featuresDescription')}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 hover:border-[var(--primary)] transition-all duration-500 cursor-default overflow-hidden"
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ background: `radial-gradient(circle at 30% 30%, ${feature.color}08 0%, transparent 60%)` }}
              />

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 origin-left scale-x-0 group-hover:scale-x-100"
                style={{ background: feature.color }}
              />

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]"
                style={{
                  background: `${feature.color}12`,
                  border: `1px solid ${feature.color}25`,
                }}
              >
                <i
                  className={`bx ${feature.icon} text-2xl`}
                  style={{ color: feature.color }}
                ></i>
              </div>

              {/* Content */}
              <h3 className="text-[var(--text-main)] text-lg font-bold mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
