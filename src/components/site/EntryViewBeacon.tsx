"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single fire-and-forget POST /api/entries/[id]/view per mount.
 */
export function EntryViewBeacon({ entryId }: { entryId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch(`/api/entries/${encodeURIComponent(entryId)}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [entryId]);

  return null;
}
