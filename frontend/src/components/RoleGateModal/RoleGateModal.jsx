import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import './RoleGateModal.css';

const RoleGateModal = ({ isOpen, onClose, type = 'organizer' }) => {
    if (!isOpen) return null;

    const { t } = useLang();

    const configs = {
        organizer: {
            icon: 'bx-trophy',
            color: '#f59e0b',
            title: t('rgmOrganizerTitle'),
            subtitle: t('rgmOrganizerSubtitle'),
            message: t('rgmOrganizerMessage'),
            applyLink: '/organizer-application',
            applyLabel: t('rgmOrganizerApply'),
            features: [
                { icon: 'bx-calendar-event', text: t('rgmOrganizerF1') },
                { icon: 'bx-group', text: t('rgmOrganizerF2') },
                { icon: 'bx-broadcast', text: t('rgmOrganizerF3') },
                { icon: 'bx-medal', text: t('rgmOrganizerF4') }
            ]
        },
        community: {
            icon: 'bx-world',
            color: '#c026d3',
            title: t('rgmCommunityTitle'),
            subtitle: t('rgmCommunitySubtitle'),
            message: t('rgmCommunityMessage'),
            applyLink: null,
            applyLabel: null,
            features: [
                { icon: 'bx-edit', text: t('rgmCommunityF1') },
                { icon: 'bx-news', text: t('rgmCommunityF2') },
                { icon: 'bx-user-plus', text: t('rgmCommunityF3') },
                { icon: 'bx-stats', text: t('rgmCommunityF4') }
            ],
            multipleLinks: [
                { to: '/role/content-creator/apply', label: t('rgmCreatorLabel'), icon: 'bx-camera', color: '#c026d3' },
                { to: '/organizer-application', label: t('rgmOrgLabel'), icon: 'bx-trophy', color: '#f59e0b' }
            ]
        }
    };

    const cfg = configs[type] || configs.organizer;

    return (
        <div className="rgm__overlay" onClick={onClose}>
            <div className="rgm__modal" onClick={e => e.stopPropagation()}>
                <button className="rgm__close" onClick={onClose}>
                    <i className='bx bx-x' />
                </button>

                <div className="rgm__icon-wrap" style={{ '--rgm-color': cfg.color }}>
                    <i className={`bx ${cfg.icon}`} />
                    <div className="rgm__icon-ring" />
                </div>

                <h2 className="rgm__title">{cfg.title}</h2>
                <p className="rgm__subtitle">{cfg.subtitle}</p>

                <div className="rgm__divider" />

                <p className="rgm__message">{cfg.message}</p>

                <div className="rgm__features">
                    {cfg.features.map((f, i) => (
                        <div className="rgm__feature" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="rgm__feature-icon" style={{ color: cfg.color }}>
                                <i className={`bx ${f.icon}`} />
                            </div>
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>

                <div className="rgm__actions">
                    {cfg.applyLink && (
                        <Link to={cfg.applyLink} className="rgm__btn rgm__btn--primary" style={{ '--rgm-color': cfg.color }} onClick={onClose}>
                            <i className='bx bx-right-arrow-alt' /> {cfg.applyLabel}
                        </Link>
                    )}

                    {cfg.multipleLinks && (
                        <div className="rgm__multi-links">
                            <span className="rgm__multi-label">Aplica como:</span>
                            {cfg.multipleLinks.map((link, i) => (
                                <Link key={i} to={link.to} className="rgm__btn rgm__btn--role" style={{ '--rgm-color': link.color }} onClick={onClose}>
                                    <i className={`bx ${link.icon}`} /> {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    <button className="rgm__btn rgm__btn--ghost" onClick={onClose}>
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleGateModal;
