import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  current: number;
  furthest: number;
  onSelect: (step: number) => void;
}

export default function StepIndicator({ steps, current, furthest, onSelect }: StepIndicatorProps) {
  return (
    <nav aria-label="Contract creation progress" className="contract-steps">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        const reachable = index <= furthest;
        return (
          <button
            key={label}
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onSelect(index)}
            aria-current={active ? 'step' : undefined}
            className={`contract-step ${active ? 'contract-step--active' : ''} ${done ? 'contract-step--done' : ''} ${!reachable ? 'contract-step--locked' : ''}`}
          >
            <span className="contract-step__number">
              {done ? <Check size={13} /> : index + 1}
            </span>
            <span className="contract-step__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
