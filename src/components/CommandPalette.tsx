import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, type LucideIcon } from 'lucide-react';

export interface CommandItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface CommandPaletteProps {
  items: CommandItem[];
}

export default function CommandPalette({ items }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((visible) => !visible);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = term
      ? items.filter((item) => item.name.toLowerCase().includes(term) || item.path.toLowerCase().includes(term))
      : items;
    return list.slice(0, 8);
  }, [items, query]);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open quick navigation"
        className="ui-focus hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gold/50 hover:text-charcoal md:flex"
      >
        <Search size={15} />
        <span>Quick navigation</span>
        <kbd className="rounded border border-gray-200 bg-ivory px-1.5 py-0.5 font-sans text-[10px] font-bold text-gray-500">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Quick navigation"
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ivory shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 border-b border-ivory-dark px-4 py-3">
              <Search size={18} className="text-gold" />
              <input
                autoFocus
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
                  if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                  if (event.key === 'Enter' && results[active]) go(results[active].path);
                }}
                placeholder="Jump to a screen or action…"
                aria-label="Search screens"
                className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-gray-400"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-[10px] font-bold uppercase tracking-wide text-gray-400 hover:text-charcoal">Esc</button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray-500">No matching screens.</p>
              ) : (
                results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(item.path)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${index === active ? 'bg-gold/10 text-charcoal' : 'text-gray-600 hover:bg-ivory-dark'}`}
                    >
                      <Icon size={17} className="shrink-0 text-gold" />
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="text-xs text-gray-400">{item.path}</span>
                      {index === active && <ArrowRight size={14} className="text-gold" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
