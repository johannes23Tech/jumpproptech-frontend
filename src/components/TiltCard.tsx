import { type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  return (
    <div className="perspective-container cursor-pointer h-full">
      <div className={`luxury-card bg-white rounded-2xl border border-gray-100 shadow-premium p-5 h-full ${className}`}>
        {children}
      </div>
    </div>
  );
}