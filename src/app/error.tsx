'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] render error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#FFFFFF',
        padding: '32px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#16181C',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E3E5EA',
          borderTop: '4px solid #E51A24',
          borderRadius: 14,
          padding: '28px 26px',
          boxShadow: '0 1px 0 #FFFFFF inset, 0 10px 30px rgba(16,18,22,.07), 0 2px 6px rgba(16,18,22,.05)',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 12,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#6B7280',
            fontWeight: 600,
          }}
        >
          Language Help BD
        </p>
        <h1 style={{ margin: '0 0 10px', fontSize: 24, lineHeight: 1.25 }}>
          This page couldn&apos;t load
        </h1>
        <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.6, color: '#6B7280' }}>
          A server error occurred while rendering this page. It is usually a temporary database
          hiccup or a settings issue on the server.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              border: '1px solid #B3141C',
              background: '#E51A24',
              color: '#fff',
              borderRadius: 10,
              padding: '11px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          <Link
            href="/"
            style={{
              border: '1px solid #E3E5EA',
              background: '#F1F2F5',
              color: '#16181C',
              borderRadius: 10,
              padding: '11px 18px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to home
          </Link>
        </div>
        {error.digest ? (
          <p style={{ margin: '18px 0 0', fontSize: 12, color: '#6B7280' }}>
            Reference for support: <code style={{ color: '#16181C' }}>{error.digest}</code>
          </p>
        ) : null}
      </div>
    </main>
  );
}
