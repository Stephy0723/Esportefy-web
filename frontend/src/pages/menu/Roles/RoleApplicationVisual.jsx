import React from 'react';

const ORGANIZER_VISUAL_IMAGE = 'https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=2070&auto=format&fit=crop';

const RoleApplicationVisual = ({ iconClass, title, description, features = [] }) => {
    return (
        <div className="visual-side organizer-visual">
            <div className="image-overlay green-overlay"></div>
            <img src={ORGANIZER_VISUAL_IMAGE} alt={title} className="moving-bg" />

            <div className="visual-content">
                <div className="icon-large">
                    <i className={iconClass}></i>
                </div>
                <h2>{title}</h2>
                <p>{description}</p>

                <div className="features-list">
                    {features.map((feature) => (
                        <span key={feature}>
                            <i className='bx bx-check-circle'></i>
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleApplicationVisual;
