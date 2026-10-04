import React from 'react';

const Logo = ({ size = 'medium', lightTheme = false }) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const iconSize = isSmall ? 36 : isLarge ? 54 : 44;
  const fontSize = isSmall ? '1.1rem' : isLarge ? '1.8rem' : '1.35rem';
  const subFontSize = isSmall ? '0.68rem' : isLarge ? '0.85rem' : '0.75rem';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      {/* Orange Washing Machine Icon Badge */}
      <div style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        borderRadius: isSmall ? '10px' : isLarge ? '16px' : '13px',
        background: 'linear-gradient(135deg, #FF6B00 0%, #FF5500 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(255, 107, 0, 0.45)',
        flexShrink: 0,
        position: 'relative'
      }}>
        {/* Crisp SVG Washing Machine Icon */}
        <svg 
          width={iconSize * 0.62} 
          height={iconSize * 0.62} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Machine Outer Box */}
          <rect x="3" y="3" width="18" height="18" rx="3.8" stroke="white" strokeWidth="2.2" />
          
          {/* Top Control Knobs */}
          <circle cx="6.5" cy="5.8" r="0.9" fill="white" />
          <line x1="14" y1="5.8" x2="17.5" y2="5.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          
          {/* Drum Door Ring */}
          <circle cx="12" cy="13.2" r="4.3" stroke="white" strokeWidth="2" />
          
          {/* Inner Drum Hub Solid Circle */}
          <circle cx="12" cy="13.2" r="2.2" fill="white" />
        </svg>
      </div>

      {/* Brand Name & Tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ 
          fontSize: fontSize, 
          fontWeight: 800, 
          color: lightTheme ? '#12121A' : '#FFFFFF', 
          lineHeight: 1.15,
          letterSpacing: '-0.3px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
          SmartWash <span style={{ color: '#FF6B00', fontWeight: 800 }}>Pro</span>
        </div>
        <div style={{ 
          fontSize: subFontSize, 
          color: lightTheme ? '#606070' : '#8B9BB4', 
          fontWeight: 500,
          marginTop: '3px',
          letterSpacing: '0.2px'
        }}>
          Crystal Clean Laundry
        </div>
      </div>
    </div>
  );
};

export default Logo;
