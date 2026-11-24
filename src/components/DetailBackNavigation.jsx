import './detail-back-navigation.css';

export default function DetailBackNavigation({ children, onBack, label = '상세 탐색' }) {
  return (
    <nav className="detail-back-navigation" aria-label={label}>
      <button type="button" onClick={onBack}>
        {children}
      </button>
    </nav>
  );
}
