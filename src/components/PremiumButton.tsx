import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function PremiumButton({ children, icon, fullWidth, className = '', ...props }: PremiumButtonProps) {
  return (
    <button
      {...props}
      className={`btn-shimmer text-black font-bold uppercase tracking-wider text-xs md:text-sm py-3 px-6 rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {icon && <span className="mb-0.5">{icon}</span>}
      {children}
    </button>
  );
}