import React from 'react';


interface ReturnBannerProps {
  referrerSection: { id: string; title: string } | null;
  onReturn: () => void;
  onClose: () => void;
}
export const ReturnBanner: React.FC<ReturnBannerProps> = ({
    referrerSection,
    onReturn,
    onClose,
}) => {
    if (!referrerSection) return null;

    return (
            <div className="return-banner">
      <div className="return-banner-text">
        <i className="fa-solid fa-circle-info"></i>
        <span>You were sent here from a Documentations page.</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="return-banner-link" onClick={onReturn}>
          Return here to "{referrerSection.title}"
        </button>
        <button className="return-banner-close" onClick={onClose} aria-label="Close banner">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
};