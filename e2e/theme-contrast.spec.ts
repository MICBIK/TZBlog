import { expect, test } from "@playwright/test";

const themes = ["aurora", "ink", "terminal"] as const;

test("allThemesPassAaContrast", async ({ page }) => {
  for (const theme of themes) {
    await page.goto("/");
    await page.evaluate((name) => {
      document.documentElement.setAttribute("data-theme", name);
    }, theme);

    const ratio = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const parseHsl = (token: string): [number, number, number] => {
        const [h, s, l] = token.trim().split(/\s+/).map(Number);
        return [h, s, l];
      };
      const toRgb = (h: number, s: number, l: number) => {
        const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
        const f = (n: number) => {
          const k = (n + h / 30) % 12;
          return l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };
        return [f(0), f(8), f(4)] as [number, number, number];
      };
      const rel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      const bg = toRgb(...parseHsl(root.getPropertyValue("--bg")));
      const fg = toRgb(...parseHsl(root.getPropertyValue("--fg")));
      const l1 = 0.2126 * rel(fg[0]) + 0.7152 * rel(fg[1]) + 0.0722 * rel(fg[2]);
      const l2 = 0.2126 * rel(bg[0]) + 0.7152 * rel(bg[1]) + 0.0722 * rel(bg[2]);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    });

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});
