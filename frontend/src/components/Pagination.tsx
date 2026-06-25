import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, pageSize, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Build page number array with ellipsis
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0 0.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Showing <strong style={{ color: '#fff' }}>{start}–{end}</strong> of <strong style={{ color: '#fff' }}>{totalItems}</strong> results
      </span>

      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={btnStyle(false, currentPage === 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ color: 'var(--text-secondary)', padding: '0 0.4rem', fontSize: '0.85rem' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={btnStyle(p === currentPage, false)}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={btnStyle(false, currentPage === totalPages)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function btnStyle(active: boolean, disabled: boolean) {
  return {
    minWidth: '32px',
    height: '32px',
    padding: '0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    fontWeight: active ? 700 : 500,
    border: active
      ? '1px solid var(--primary-accent)'
      : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '5px',
    backgroundColor: active ? 'var(--primary-accent)' : 'transparent',
    color: active ? '#fff' : disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s'
  } as React.CSSProperties;
}
