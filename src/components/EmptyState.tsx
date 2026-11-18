import { type ReactNode } from 'react';

export default function EmptyState({ icon, title, description, action }: { icon: ReactNode, title: string, description: string, action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-white to-ivory">
      <div className="w-20 h-20 bg-ivory-dark rounded-2xl flex items-center justify-center mb-5 text-gold shadow-inner ring-1 ring-gold/10">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-bold text-black mb-2">{title}</h3>
      <p className="text-gray-500 max-w-lg mb-7 leading-relaxed text-sm">{description}</p>
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}