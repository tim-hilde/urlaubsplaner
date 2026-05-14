import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BUNDESLAENDER } from '../lib/holidays/states';
import type { BundeslandCode } from '../lib/holidays/types';

interface BundeslandSelectProps {
  value: BundeslandCode;
  onChange: (code: BundeslandCode) => void;
}

const TYPE_AHEAD_RESET_MS = 800;

export function BundeslandSelect({ value, onChange }: BundeslandSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const typeBufferRef = useRef('');
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (code: string) => `${baseId}-option-${code}`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const currentIndex = useMemo(
    () => BUNDESLAENDER.findIndex(([code]) => code === value),
    [value]
  );

  const currentName = BUNDESLAENDER[currentIndex]?.[1] ?? value;

  const openList = useCallback((initialIndex?: number) => {
    setHighlightedIndex(initialIndex ?? currentIndex);
    setOpen(true);
  }, [currentIndex]);

  const closeList = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectIndex = useCallback((index: number) => {
    const entry = BUNDESLAENDER[index];
    if (entry) onChange(entry[0]);
    closeList();
  }, [onChange, closeList]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open) return;
    const listbox = listboxRef.current;
    if (!listbox) return;
    const highlighted = listbox.querySelector('.bundesland-select__option--highlighted');
    if (highlighted && typeof (highlighted as HTMLElement).scrollIntoView === 'function') {
      (highlighted as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  // Outside click handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const wrapper = triggerRef.current?.closest('.bundesland-select');
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openList();
    }
  }, [openList]);

  const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Allow Tab to work normally (don't prevent default)
    if (e.key === 'Tab') {
      closeList();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeList();
      return;
    }
    e.preventDefault();
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((i) => Math.min(i + 1, BUNDESLAENDER.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      setHighlightedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Home') {
      setHighlightedIndex(0);
      return;
    }
    if (e.key === 'End') {
      setHighlightedIndex(BUNDESLAENDER.length - 1);
      return;
    }
    if (e.key === 'Enter') {
      selectIndex(highlightedIndex);
      return;
    }
    // Type-ahead
    if (e.key.length === 1) {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
      typeBufferRef.current += e.key.toLowerCase();
      typeTimerRef.current = setTimeout(() => {
        typeBufferRef.current = '';
      }, TYPE_AHEAD_RESET_MS);
      const buf = typeBufferRef.current;
      const match = BUNDESLAENDER.findIndex(([, name]) =>
        name.toLowerCase().startsWith(buf)
      );
      if (match >= 0) setHighlightedIndex(match);
    }
  }, [highlightedIndex, selectIndex, closeList]);

  // Focus listbox when opened
  useEffect(() => {
    if (open) listboxRef.current?.focus();
  }, [open]);

  // Cleanup type-ahead timer on unmount
  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
    };
  }, []);

  return (
    <div className="bundesland-select">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(BUNDESLAENDER[highlightedIndex]?.[0] ?? value) : undefined}
        className="bundesland-select__trigger"
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleTriggerKeyDown}
      >
        {currentName}
      </button>

      {open && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Bundesland auswählen"
          tabIndex={-1}
          className="bundesland-select__listbox"
          onKeyDown={handleListKeyDown}
        >
          {BUNDESLAENDER.map(([code, name], index) => (
            <li
              key={code}
              id={optionId(code)}
              role="option"
              aria-selected={code === value}
              className={
                'bundesland-select__option' +
                (index === highlightedIndex ? ' bundesland-select__option--highlighted' : '')
              }
              onMouseDown={(e) => {
                e.preventDefault(); // prevent trigger blur before click registers
                selectIndex(index);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
