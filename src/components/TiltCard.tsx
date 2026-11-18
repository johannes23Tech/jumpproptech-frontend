import { type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  return (
    <div className="perspective-container h-full">
      <div
        className={`luxury-card group relative bg-white rounded-2xl border border-gray-100 shadow-premium p-5 h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:border-gold/30 focus-within:ring-2 focus-within:ring-gold/20 ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {children}
      </div>
    </div>
  );
}