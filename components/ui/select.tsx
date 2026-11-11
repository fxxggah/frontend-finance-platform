import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id: idProp, placeholder, children, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text leading-none">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={!!error}
            className={cn(
              // base
              'min-h-11 w-full min-w-0 appearance-none rounded-xl bg-surface px-4 pr-10 text-sm text-text',
              'border border-border outline-none',
              // foco
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              // erro
              error && 'border-expense focus:border-expense focus:ring-expense/20',
              // disabled
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors duration-150 motion-reduce:transition-none',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>

          {/* chevron decorativo */}
          <ChevronDown
            className="pointer-events-none absolute right-3.5 size-4 text-text-muted"
            aria-hidden="true"
          />
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
Select.displayName = 'Select';

export { Select };

