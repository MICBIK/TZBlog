"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single fire-and-forget POST /api/posts/[slug]/view per mount.
 *
 * Failures are silently swallowed: a missed beacon is acceptable and we never
 * want a counter outage to surface a console error to the reader. Server-side
 * de-dup (visitorHash) handles the case where a user reloads the same article
 * within the same day, so it's safe to fire on every mount.
 */
export function PostViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
    }).catch(() => {});
  }, [slug]);

  return null;
}
