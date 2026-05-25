"use client";

import * as React from "react";

export interface ReadingProgressProps {
  targetSelector?: string;
}

export function ReadingProgress({
  targetSelector = "[data-article-reader]",
}: ReadingProgressProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const updateProgress = () => {
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const total = rect.height - viewportHeight;

      if (total <= 0) {
        setProgress(rect.top <= 0 ? 100 : 0);
        return;
      }

      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(Math.round((scrolled / total) * 100));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [targetSelector]);

  return (
    <div
      data-testid="reading-progress"
      role="progressbar"
      aria-label="阅读进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-muted"
    >
      <div
        aria-hidden="true"
        data-reading-progress-bar
        className="h-full origin-left bg-accent transition-[transform] duration-150 ease-out"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
