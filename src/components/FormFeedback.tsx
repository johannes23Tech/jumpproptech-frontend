import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import PremiumButton from './PremiumButton';

export function PageBanner({ message, onDismiss }: { message: string, onDismiss: () => void }) {
  return (
    <div role="status" className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-success/20 bg-success/10 p-4 text-success">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle size={18} className="shrink-0" />
        <span>{message}</span>
      </div>
      <button type="button" onClick={onDismiss} className="text-xs font-bold hover:underline">
        Dismiss
      </button>
    </div>
  );
}

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading: boolean;
  loadingText: string;
  error: string;
  fullWidth?: boolean;
}

export function SubmitButton({
  children,
  loading,
  loadingText,
  error,
  fullWidth = true,
  disabled,
  ...buttonProps
}: SubmitButtonProps) {
  const [showError, setShowError] = useState(false);

  return (
    <div className="flex-1">
      <PremiumButton
        {...buttonProps}
        type="submit"
        fullWidth={fullWidth}
        disabled={disabled || loading}
        icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
      >
        {loading ? loadingText : children}
      </PremiumButton>
      {error && (
        <div className="mt-2 text-sm text-danger">
          <button
            type="button"
            aria-expanded={showError}
            onClick={() => setShowError((visible) => !visible)}
            className="inline-flex items-center gap-1 font-semibold hover:underline"
          >
            <ChevronDown size={16} className={showError ? 'rotate-180 transition-transform' : 'transition-transform'} />
            {showError ? 'Hide error details' : 'Could not save. Show reason'}
          </button>
          {showError && <p role="alert" className="mt-1 rounded-lg bg-danger/10 p-3">{error}</p>}
        </div>
      )}
    </div>
  );
}
