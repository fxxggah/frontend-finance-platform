'use client';

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { maskMoneyInput, moneyPasteDigits } from '@/lib/format/money';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode'> {
  value?: string;
  onValueChange: (value: string) => void;
  allowNegative?: boolean;
}

const digitCount = (text: string) => text.replace(/\D/g, '').length;

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = '', onValueChange, allowNegative = false, className, onKeyDown, onPaste, readOnly, disabled, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingCaret = useRef<number | null>(null);
    const [revision, setRevision] = useState(0);
    useImperativeHandle(ref, () => inputRef.current!);

    useLayoutEffect(() => {
      if (pendingCaret.current !== null) {
        inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
        pendingCaret.current = null;
      }
    }, [value, revision]);

    function commit(raw: string, caret: number) {
      const formatted = maskMoneyInput(raw, allowNegative);
      if (formatted === null) {
        if (inputRef.current) inputRef.current.value = value;
        return;
      }
      // Anchor to the number of digits on the right, independent of separators.
      const right = digitCount(raw.slice(caret));
      let position = formatted.length;
      let remaining = right;
      while (position > 0 && remaining > 0) {
        position--;
        if (/\d/.test(formatted[position])) remaining--;
      }
      pendingCaret.current = position;
      onValueChange(formatted);
      setRevision((current) => current + 1);
    }

    function toggleSign() {
      const raw = value.startsWith('-') ? value.slice(1) : `-${value}`;
      commit(raw, raw.length);
    }

    return (
      <Input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder={props.placeholder ?? '0,00'}
        className={cn('tabular-nums', allowNegative && 'pr-16', className)}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        endAdornment={allowNegative ? (
          <button
            type="button"
            className="grid min-h-11 min-w-11 place-items-center rounded-lg text-lg text-text-muted focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Alternar sinal do saldo"
            aria-pressed={value.startsWith('-')}
            disabled={disabled || readOnly}
            onClick={() => { inputRef.current?.focus(); toggleSign(); }}
          >
            {value.startsWith('-') ? '−' : '+'}
          </button>
        ) : props.endAdornment}
        onChange={(event) => {
          const input = event.currentTarget;
          const caret = input.selectionStart ?? input.value.length;
          const inputType = (event.nativeEvent as InputEvent).inputType;
          // Virtual keyboards can delete a separator without a keydown event.
          if ((inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') && digitCount(input.value) === digitCount(value)) {
            const backwards = inputType === 'deleteContentBackward';
            const nextDigit = value.slice(caret).search(/\d/);
            const index = backwards
              ? value.slice(0, caret).search(/\d\D*$/)
              : nextDigit < 0 ? -1 : nextDigit + caret;
            if (index >= 0 && /\d/.test(value[index] ?? '')) {
              commit(value.slice(0, index) + value.slice(index + 1), index);
              return;
            }
          }
          commit(input.value, caret);
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented || readOnly || disabled) return;
          event.preventDefault();
          const digits = moneyPasteDigits(event.clipboardData.getData('text'), allowNegative);
          if (digits === null) return;
          const input = event.currentTarget;
          const start = input.selectionStart ?? 0;
          const end = input.selectionEnd ?? start;
          const raw = value.slice(0, start) + digits + value.slice(end);
          commit(raw, start + digits.length);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || readOnly || disabled || event.ctrlKey || event.metaKey || event.altKey) return;
          const input = event.currentTarget;
          let start = input.selectionStart ?? 0;
          let end = input.selectionEnd ?? start;
          if (event.key === '-' && allowNegative) {
            event.preventDefault();
            toggleSign();
          } else if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            if (/^-?0,00$/.test(value) && start === end) {
              commit('', 0);
              return;
            }
            if (start === end) {
              if (event.key === 'Backspace') {
                while (start > 0 && /[.,]/.test(value[start - 1])) start--;
                if (start > 0) start--;
              } else {
                while (end < value.length && /[.,]/.test(value[end])) end++;
                if (end < value.length) end++;
              }
            }
            commit(value.slice(0, start) + value.slice(end), start);
          } else if (event.key.length === 1 && !/\d/.test(event.key)) {
            event.preventDefault();
          }
        }}
      />
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';
