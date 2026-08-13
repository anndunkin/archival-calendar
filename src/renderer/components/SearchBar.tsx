import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}

export function SearchBar({ value, onChange, inputRef, placeholder }: SearchBarProps): React.JSX.Element {
  return (
    <input
      ref={inputRef}
      className="search-input"
      type="search"
      value={value}
      placeholder={placeholder ?? 'Search events…'}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
