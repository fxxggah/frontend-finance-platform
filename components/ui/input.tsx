import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Ícone à esquerda do campo */
  startAdornment?: React.ReactNode;
  /** Ícone/botão à direita do campo */
  endAdornment?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id: idProp, startAdornment, endAdornment, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text leading-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {startAdornment && (
            <span className="pointer-events-none absolute left-3.5 flex items-center text-text-muted [&_svg]:size-4">
              {startAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={!!error}
            className={cn(
              // base
              'h-11 w-full rounded-2xl bg-surface-soft px-4 text-sm text-text',
              'border border-border outline-none',
              'placeholder:text-text-muted',
              // foco
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              // erro
              error && 'border-expense focus:border-expense focus:ring-expense/20',
              // disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              // adornos
              startAdornment && 'pl-10',
              endAdornment && 'pr-10',
              'transition-colors duration-150 motion-reduce:transition-none',
              className,
            )}
            {...props}
          />

          {endAdornment && (
            <span className="absolute right-3.5 flex items-center text-text-muted [&_svg]:size-4">
              {endAdornment}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-expense">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };

