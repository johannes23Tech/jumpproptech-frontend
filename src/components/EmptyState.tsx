import { type ReactNode } from 'react';

export default function EmptyState({ icon, title, description, action }: { icon: ReactNode, title: string, description: string, action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 bg-ivory-dark rounded-full flex items-center justify-center mb-6 text-gold shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-bold text-black mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed text-sm">{description}</p>
      {action && <div className="btn-tactile">{action}</div>}
    </div>
  );
}