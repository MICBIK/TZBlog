import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-3');
    expect(result).toBe('py-1 px-3');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should handle false/null/undefined gracefully', () => {
    const result = cn('base', false, null, undefined, 'active');
    expect(result).toBe('base active');
  });

  it('should merge conflicting Tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['px-2', 'py-1'], 'mt-4');
    expect(result).toBe('px-2 py-1 mt-4');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
      'font-bold': true,
    });
    expect(result).toContain('text-red-500');
    expect(result).toContain('font-bold');
    expect(result).not.toContain('text-blue-500');
  });

  it('should return empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
