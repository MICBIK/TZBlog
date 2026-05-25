"use client";

import { useEffect, useState } from "react";

export function TerminalCursor() {
  const [staticCursor, setStaticCursor] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStaticCursor(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <span
      data-testid="terminal-cursor"
      data-static={staticCursor ? "true" : undefined}
      className={
        staticCursor
          ? "terminal-cursor terminal-cursor--static ml-0.5 inline-block h-[1em] w-[0.55em] bg-primary align-[-0.1em]"
          : "terminal-cursor ml-0.5 inline-block h-[1em] w-[0.55em] bg-primary align-[-0.1em]"
      }
      aria-hidden
    />
  );
}
