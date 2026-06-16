import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card Content</Card>);

      const card = screen.getByText(/card content/i);
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>);

      const card = screen.getByText(/content/i);
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader>Header Content</CardHeader>);

      const header = screen.getByText(/header content/i);
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);

      const header = screen.getByText(/header/i);
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>Card Title</CardTitle>);

      const title = screen.getByText(/card title/i);
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);

      const title = screen.getByText(/title/i);
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Card Description</CardDescription>);

      const description = screen.getByText(/card description/i);
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });

    it('should apply custom className', () => {
      render(
        <CardDescription className="custom-desc">Description</CardDescription>,
      );

      const description = screen.getByText(/description/i);
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('CardAction', () => {
    it('should render card action', () => {
      render(<CardAction>Action Button</CardAction>);

      const action = screen.getByText(/action button/i);
      expect(action).toBeInTheDocument();
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('should apply custom className', () => {
      render(<CardAction className="custom-action">Action</CardAction>);

      const action = screen.getByText(/action/i);
      expect(action).toHaveClass('custom-action');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent>Content Area</CardContent>);

      const content = screen.getByText(/content area/i);
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('should apply custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);

      const content = screen.getByText(/content/i);
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter>Footer Content</CardFooter>);

      const footer = screen.getByText(/footer content/i);
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);

      const footer = screen.getByText(/footer/i);
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Card Composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
          <CardFooter>Footer information</CardFooter>
        </Card>,
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('This is a test card')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /action/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/card content goes here/i)).toBeInTheDocument();
      expect(screen.getByText(/footer information/i)).toBeInTheDocument();
    });
  });
});
