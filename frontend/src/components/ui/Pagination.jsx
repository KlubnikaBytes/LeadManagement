import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Pagination = ({ pagination, onPageChange }) => {
  const { page, limit, total, totalPages } = pagination
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-kb-sand bg-kb-white">
      <p className="text-xs sm:text-sm text-kb-muted text-center sm:text-left">
        Showing <span className="font-medium text-kb-text">{start}–{end}</span> of{' '}
        <span className="font-medium text-kb-text">{total}</span> results
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-icon disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-sm text-kb-muted hover:bg-kb-cream-deep">1</button>
            {pages[0] > 2 && <span className="text-kb-taupe px-1">…</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-kb-strawberry text-kb-white' : 'text-kb-muted hover:bg-kb-cream-deep'}`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-kb-taupe px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 rounded-lg text-sm text-kb-muted hover:bg-kb-cream-deep">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-icon disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
