"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";

const STORAGE_PREFIX = "tzblog.terminal.boot.v1";

const BOOT_LINES = [
  "[ ok ] mounting /dev/blog",
  "[ ok ] loading channel modules",
  "[ ok ] starting grep daemon",
  "[ ok ] stream ready",
] as const;

const BOOT_DURATION_MS = 1200;

type BootSequenceProps = {
  channelSlug: string;
};

function readSkipKey(channelSlug: string): string {
  return `${STORAGE_PREFIX}:${channelSlug}`;
}

function readShouldSkipBoot(storageKey: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  if (window.localStorage.getItem(storageKey) === "1") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BootSequence({ channelSlug }: BootSequenceProps) {
  const storageKey = readSkipKey(channelSlug);
  const shouldSkip = useSyncExternalStore(
    () => () => {},
    () => readShouldSkipBoot(storageKey),
    () => true,
  );
  const [done, setDone] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  const finish = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, "1");
    }
    setDone(true);
  }, [storageKey]);

  useEffect(() => {
    if (shouldSkip || done) {
      return;
    }

    const intervalMs = BOOT_DURATION_MS / BOOT_LINES.length;
    let index = 0;

    const timer = window.setInterval(() => {
      index += 1;
      if (index >= BOOT_LINES.length) {
        window.clearInterval(timer);
        finish();
        return;
      }
      setLineCount(index + 1);
    }, intervalMs);

    const timeout = window.setTimeout(finish, BOOT_DURATION_MS + 50);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [done, finish, shouldSkip, storageKey]);

  if (shouldSkip || done) {
    return null;
  }

  return (
    <div
      data-testid="terminal-boot"
      className="mb-4 border border-border bg-muted/40 px-4 py-3 font-mono text-xs text-muted-fg"
    >
      <div className="space-y-1" aria-live="polite">
        {BOOT_LINES.slice(0, lineCount).map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <button
        type="button"
        data-testid="terminal-boot-skip"
        onClick={finish}
        className="mt-3 text-accent underline-offset-2 hover:underline"
      >
        skip
      </button>
    </div>
  );
}
