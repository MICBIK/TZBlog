# Milkdown Code Fixture

## TypeScript

```ts
export function greet(name: string): string {
  return `hello, ${name}`;
}
```

## Bash

```bash
pnpm install --frozen-lockfile
echo "done"
```

## JSON

```json
{
  "title": "fixture",
  "count": 42
}
```

Inline `const answer = 42` should remain verbatim.
