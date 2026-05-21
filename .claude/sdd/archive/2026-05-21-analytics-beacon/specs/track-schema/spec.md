# Spec — track-schema

> Capability: trackPayloadSchema zod 校验
> Stage: P2-Analytics §A
> SPEC-ID 前缀：`SPEC-A-S-`

## Domain rules

- `path` 是 SPA 路径，必须以 `/` 开头，max 500 字符
- `referrer` 可选；接受空字符串（document.referrer 可能空）或合法 URL，max 500

## Specs

### SPEC-A-S-1 — accepts valid path + referrer

```ts
trackPayloadSchema.parse({ path: "/", referrer: "" }) // OK
trackPayloadSchema.parse({ path: "/posts/hello", referrer: "https://google.com" }) // OK
trackPayloadSchema.parse({ path: "/" }) // OK (referrer 可省)
```

### SPEC-A-S-2 — rejects invalid path

```ts
trackPayloadSchema.parse({ path: "" })            // FAIL: min 1
trackPayloadSchema.parse({ path: "not-leading-slash" }) // FAIL: 必须 / 开头
trackPayloadSchema.parse({ path: "/" + "x".repeat(500) }) // FAIL: max 500
```

### SPEC-A-S-3 — rejects invalid referrer (when present)

```ts
trackPayloadSchema.parse({ path: "/", referrer: "not-a-url" }) // FAIL: url-or-empty
trackPayloadSchema.parse({ path: "/", referrer: "x".repeat(501) }) // FAIL: max 500
```
