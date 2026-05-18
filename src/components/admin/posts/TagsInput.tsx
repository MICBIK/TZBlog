"use client";

import * as React from "react";

export interface TagSuggestion {
  slug: string;
  name: string;
}

export interface TagsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: TagSuggestion[];
  placeholder?: string;
}

/**
 * Minimal chip-based tag editor.
 *
 * Stores tag *slugs* in `value`. Free-text input is normalised to a slug shape
 * (lowercased, spaces -> "-") on commit. Enter or comma commits the current
 * draft; Backspace on an empty draft removes the last chip. Suggestions are
 * surfaced as a tiny floating list while typing — clicking one commits it.
 */
export function TagsInput({
  value,
  onChange,
  suggestions,
  placeholder = "输入标签...",
}: TagsInputProps) {
  const [draft, setDraft] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const slugify = (raw: string): string =>
    raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const addTag = (raw: string) => {
    const slug = slugify(raw);
    if (!slug) return;
    if (value.includes(slug)) {
      setDraft("");
      return;
    }
    onChange([...value, slug]);
    setDraft("");
  };

  const removeTag = (slug: string) => {
    onChange(value.filter((s) => s !== slug));
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
      return;
    }
    if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const filteredSuggestions = React.useMemo(() => {
    const draftSlug = slugify(draft);
    if (!draftSlug) return [];
    return suggestions
      .filter(
        (s) =>
          !value.includes(s.slug) &&
          (s.slug.includes(draftSlug) ||
            s.name.toLowerCase().includes(draft.toLowerCase())),
      )
      .slice(0, 6);
  }, [draft, suggestions, value]);

  return (
    <div className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-2 text-sm focus-within:ring-2 focus-within:ring-[hsl(var(--ring))]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((slug) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))]/40 px-2 py-0.5 text-xs text-[hsl(var(--fg))]"
          >
            {slug}
            <button
              type="button"
              aria-label={`移除标签 ${slug}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(slug);
              }}
              className="text-[hsl(var(--muted))] transition-colors hover:text-[hsl(var(--fg))]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so suggestion mousedown can register first.
            setTimeout(() => setFocused(false), 120);
            if (draft.trim()) addTag(draft);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted))]"
        />
      </div>

      {focused && filteredSuggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg))] py-1 text-sm shadow-md">
          {filteredSuggestions.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s.slug);
                  inputRef.current?.focus();
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[hsl(var(--muted))]/30"
              >
                <span>{s.name}</span>
                <span className="text-xs text-[hsl(var(--muted))]">
                  {s.slug}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default TagsInput;
