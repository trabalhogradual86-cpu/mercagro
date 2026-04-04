import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
      background: type === 'success' ? '#d1fae5' : '#fee2e2',
      border: `1px solid ${type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
      color: type === 'success' ? '#065f46' : '#991b1b',
      padding: '0.75rem 1.25rem', borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      fontWeight: 600, fontSize: '0.9rem', maxWidth: '320px',
    }}>
      {message}
    </div>
  );
}
