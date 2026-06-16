import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button Component', () => {
  it('should render with default variant and size', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    let button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveAttribute('data-variant', 'destructive');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveAttribute('data-variant', 'outline');

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole('button', { name: /ghost/i });
    expect(button).toHaveAttribute('data-variant', 'ghost');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="xs">XS Button</Button>);
    let button = screen.getByRole('button', { name: /xs button/i });
    expect(button).toHaveAttribute('data-size', 'xs');

    rerender(<Button size="sm">SM Button</Button>);
    button = screen.getByRole('button', { name: /sm button/i });
    expect(button).toHaveAttribute('data-size', 'sm');

    rerender(<Button size="lg">LG Button</Button>);
    button = screen.getByRole('button', { name: /lg button/i });
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('should render icon sizes', () => {
    const { rerender } = render(
      <Button size="icon" aria-label="icon button">
        X
      </Button>,
    );
    let button = screen.getByRole('button', { name: /icon button/i });
    expect(button).toHaveAttribute('data-size', 'icon');

    rerender(
      <Button size="icon-sm" aria-label="small icon">
        X
      </Button>,
    );
    button = screen.getByRole('button', { name: /small icon/i });
    expect(button).toHaveAttribute('data-size', 'icon-sm');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>);

    const button = screen.getByRole('button', { name: /button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should accept additional HTML attributes', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>,
    );

    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should have proper data-slot attribute', () => {
    render(<Button>Button</Button>);

    const button = screen.getByRole('button', { name: /button/i });
    expect(button).toHaveAttribute('data-slot', 'button');
  });
});
