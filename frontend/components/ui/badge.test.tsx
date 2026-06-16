import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge Component', () => {
  it('should render with default variant', () => {
    render(<Badge>Default Badge</Badge>);

    const badge = screen.getByText(/default badge/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-variant', 'default');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    let badge = screen.getByText(/secondary/i);
    expect(badge).toHaveAttribute('data-variant', 'secondary');

    rerender(<Badge variant="destructive">Destructive</Badge>);
    badge = screen.getByText(/destructive/i);
    expect(badge).toHaveAttribute('data-variant', 'destructive');

    rerender(<Badge variant="outline">Outline</Badge>);
    badge = screen.getByText(/outline/i);
    expect(badge).toHaveAttribute('data-variant', 'outline');

    rerender(<Badge variant="ghost">Ghost</Badge>);
    badge = screen.getByText(/ghost/i);
    expect(badge).toHaveAttribute('data-variant', 'ghost');

    rerender(<Badge variant="link">Link</Badge>);
    badge = screen.getByText(/link/i);
    expect(badge).toHaveAttribute('data-variant', 'link');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Badge</Badge>);

    const badge = screen.getByText(/badge/i);
    expect(badge).toHaveClass('custom-badge');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/tag">Tag Link</a>
      </Badge>,
    );

    const link = screen.getByRole('link', { name: /tag link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/tag');
  });

  it('should have proper data-slot attribute', () => {
    render(<Badge>Test</Badge>);

    const badge = screen.getByText(/test/i);
    expect(badge).toHaveAttribute('data-slot', 'badge');
  });

  it('should render with children content', () => {
    render(
      <Badge>
        <span>Icon</span> Text
      </Badge>,
    );

    expect(screen.getByText(/icon/i)).toBeInTheDocument();
    expect(screen.getByText(/icon/i).parentElement).toHaveTextContent(
      'Icon Text',
    );
  });

  it('should accept additional HTML attributes', () => {
    render(
      <Badge data-testid="test-badge" aria-label="status badge">
        Status
      </Badge>,
    );

    const badge = screen.getByTestId('test-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'status badge');
  });
});
