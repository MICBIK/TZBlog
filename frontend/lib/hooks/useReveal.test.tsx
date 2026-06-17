import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReveal } from './useReveal';

const observeMock = vi.fn();
const unobserveMock = vi.fn();
const disconnectMock = vi.fn();
const matchMediaMock = vi.fn();

let latestObserverCallback:
  | ((entries: IntersectionObserverEntry[]) => void)
  | null = null;

class MockIntersectionObserver {
  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    latestObserverCallback = callback;
  }

  observe = observeMock;
  unobserve = unobserveMock;
  disconnect = disconnectMock;
}

function RevealProbe() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div>
      <div ref={ref} data-testid="target" />
      <span data-testid="visible">{String(visible)}</span>
    </div>
  );
}

describe('useReveal', () => {
  beforeEach(() => {
    observeMock.mockClear();
    unobserveMock.mockClear();
    disconnectMock.mockClear();
    latestObserverCallback = null;

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    matchMediaMock.mockReset();
    window.matchMedia = matchMediaMock;
  });

  it('starts visible when reduced motion is preferred', () => {
    matchMediaMock.mockReturnValue({ matches: true });

    render(<RevealProbe />);

    expect(screen.getByTestId('visible')).toHaveTextContent('true');
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('reveals once the element intersects', () => {
    matchMediaMock.mockReturnValue({ matches: false });

    render(<RevealProbe />);
    const element = screen.getByTestId('target');

    expect(observeMock).toHaveBeenCalledWith(element);
    expect(screen.getByTestId('visible')).toHaveTextContent('false');

    act(() => {
      latestObserverCallback?.([
        {
          isIntersecting: true,
          target: element,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    expect(screen.getByTestId('visible')).toHaveTextContent('true');
    expect(unobserveMock).toHaveBeenCalledWith(element);
  });
});
