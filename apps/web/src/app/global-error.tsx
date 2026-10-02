'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body style={{ background: '#FFFFFF', color: '#111111', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, textAlign: 'center', padding: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#6D28D9' }}>
          TTRC Store — Critical Error
        </h1>
        <p style={{ color: '#4B5563', marginBottom: '2rem', maxWidth: '400px', lineHeight: 1.6 }}>
          A critical error has occurred. Please refresh the page.
          {error.digest && <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>Reference: {error.digest}</span>}
        </p>
        <button
          onClick={reset}
          style={{ padding: '0.75rem 1.5rem', background: '#6D28D9', color: '#FFFFFF', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Reload Page
        </button>
      </body>
    </html>
  );
}
