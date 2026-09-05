import React, { useState, useEffect, useRef } from 'react';

interface NumericInputProps {
  id: string;
  value: number | string;
  onChange: (val: number, raw: string) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  className?: string;
  allowDecimals?: boolean;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  onClear?: () => void;
  ariaLabel?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  min = 0,
  max,
  step = 'any',
  placeholder,
  className = '',
  allowDecimals = true,
  prefix,
  suffix,
  disabled = false,
  ariaLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalRaw, setInternalRaw] = useState<string>(() => {
    if (value === undefined || value === null || value === '') return '';
    return String(value);
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal raw value when external value changes while not focused
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null || value === '') {
        setInternalRaw('');
      } else {
        setInternalRaw(String(value));
      }
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Instant select-all so typing immediate replaces 0, 0.00, or previous number
    requestAnimationFrame(() => {
      e.target.select();
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Convert comma to dot for international decimal keyboards
    raw = raw.replace(',', '.');

    // Filter invalid characters
    if (allowDecimals) {
      // Allow only numbers and a single dot
      if (!/^[0-9]*\.?[0-9]*$/.test(raw)) {
        return;
      }
    } else {
      // Only digits
      if (!/^[0-9]*$/.test(raw)) {
        return;
      }
    }

    setInternalRaw(raw);

    if (raw === '' || raw === '.') {
      onChange(0, raw);
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      if (min !== undefined && num < min) {
        // Allow user to finish typing intermediate values (e.g. typing 0 before 0.5)
        onChange(num, raw);
      } else if (max !== undefined && num > max) {
        onChange(max, String(max));
      } else {
        onChange(num, raw);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (internalRaw === '' || internalRaw === '.') {
      const fallback = min !== undefined ? min : 0;
      setInternalRaw(String(fallback));
      onChange(fallback, String(fallback));
      return;
    }

    let num = parseFloat(internalRaw);
    if (isNaN(num)) {
      num = min !== undefined ? min : 0;
    }

    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    setInternalRaw(String(num));
    onChange(num, String(num));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrow up / down increment
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const stepVal = typeof step === 'number' ? step : (allowDecimals ? 0.1 : 1);
      const current = parseFloat(internalRaw) || 0;
      const next = e.key === 'ArrowUp' ? current + stepVal : current - stepVal;
      const clamped = Math.max(min ?? 0, max !== undefined ? Math.min(max, next) : next);
      const rounded = allowDecimals ? Math.round(clamped * 1000) / 1000 : Math.round(clamped);
      setInternalRaw(String(rounded));
      onChange(rounded, String(rounded));
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-2.5 text-xs font-mono font-bold text-gray-500 pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        value={internalRaw}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full rounded border font-mono text-xs font-bold transition-colors focus:outline-none ${
          prefix ? 'pl-7' : 'pl-2.5'
        } ${suffix ? 'pr-8' : 'pr-2.5'} py-1.5 ${className}`}
      />
      {suffix && (
        <span className="absolute right-2.5 text-[10px] font-mono font-bold text-gray-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
