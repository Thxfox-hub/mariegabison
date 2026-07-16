/**
 * FlagIcons.jsx - SVG flag icons for language switcher
 * Works on all browsers without emoji font support (Firefox/Linux)
 */

const flagStyle = { borderRadius: 2, display: 'inline-block', verticalAlign: 'middle' };

export const FLAGS = {
  fr: (
    <svg width="20" height="14" viewBox="0 0 30 20" style={flagStyle}>
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </svg>
  ),
  en: (
    <svg width="20" height="14" viewBox="0 0 60 40" style={flagStyle}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  it: (
    <svg width="20" height="14" viewBox="0 0 30 20" style={flagStyle}>
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#CE2B37" />
    </svg>
  ),
  ru: (
    <svg width="20" height="14" viewBox="0 0 30 20" style={flagStyle}>
      <rect width="30" height="6.67" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
      <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
    </svg>
  ),
};

export function Flag({ code, size = 20 }) {
  const flag = FLAGS[code];
  if (!flag) return null;
  if (size === 20) return flag;
  return <span style={{ display: 'inline-flex', transform: `scale(${size / 20})`, transformOrigin: 'left center' }}>{flag}</span>;
}
