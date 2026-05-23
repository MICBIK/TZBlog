"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function MarkdownCopyButtons() {
  useEffect(() => {
    const timers = new Map<HTMLButtonElement, number>();

    async function copyFromButton(button: HTMLButtonElement) {
      const figure = button.closest("figure.code-block");
      const code = figure?.querySelector("pre code");

      if (!code) {
        toast.error("复制代码失败", {
          description: "未找到可复制的代码块。",
        });
        return;
      }

      if (!navigator.clipboard?.writeText) {
        toast.error("复制代码失败", {
          description: "当前浏览器不支持 Clipboard API。",
        });
        return;
      }

      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        button.dataset.state = "copied";

        const previousTimer = timers.get(button);
        if (previousTimer) window.clearTimeout(previousTimer);

        const timer = window.setTimeout(() => {
          button.dataset.state = "idle";
          timers.delete(button);
        }, 1500);
        timers.set(button, timer);
      } catch (error) {
        toast.error("复制代码失败", {
          description:
            error instanceof Error ? error.message : "浏览器拒绝写入剪贴板。",
        });
      }
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>("[data-copy]");
      if (!button) return;

      void copyFromButton(button);
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return null;
}
