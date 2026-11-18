import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export default function PremiumButton({
  children,
  icon,
  fullWidth,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: PremiumButtonProps) {
  const base = 'font-bold uppercase tracking-wider rounded-xl inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40';
  const sizes = size === 'sm'
    ? 'text-[11px] md:text-xs py-2.5 px-4'
    : 'text-xs md:text-sm py-3 px-6';
  const variants: Record<string, string> = {
    primary: 'btn-shimmer text-black shadow-gold hover:brightness-105',
    secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 hover:border-gold/40 shadow-sm',
    ghost: 'bg-transparent text-gray-700 border border-transparent hover:bg-gray-100',
    danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
  };

  return (
    <button
      {...props}
      className={`${base} ${sizes} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}