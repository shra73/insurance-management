export default function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400" aria-hidden="true">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M3 7l3-4h12l3 4" />
          <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}