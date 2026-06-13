(function () {
  const qsa = (root, selector) => Array.from(root.querySelectorAll(selector));
  const qs = (root, selector) => root.querySelector(selector);

  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(toastEl);
  });

  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, 2200);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderSimpleMarkdown(source) {
    const lines = source.split("\n");
    const blocks = [];
    let inList = false;
    let inCode = false;
    const closeList = () => {
      if (inList) {
        blocks.push("</ul>");
        inList = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trimEnd();

      if (trimmed.startsWith("```")) {
        closeList();
        if (!inCode) {
          inCode = true;
          blocks.push("<pre><code>");
        } else {
          inCode = false;
          blocks.push("</code></pre>");
        }
        return;
      }

      if (inCode) {
        blocks.push(escapeHtml(trimmed));
        return;
      }

      if (trimmed.startsWith("### ")) {
        closeList();
        blocks.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
        return;
      }

      if (trimmed.startsWith("## ")) {
        closeList();
        blocks.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
        return;
      }

      if (trimmed.startsWith("# ")) {
        closeList();
        blocks.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
        return;
      }

      if (trimmed.startsWith("- ")) {
        if (!inList) {
          blocks.push("<ul class=\"bullet-list\">");
          inList = true;
        }
        blocks.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
        return;
      }

      if (!trimmed) {
        closeList();
        return;
      }

      closeList();
      blocks.push(`<p>${escapeHtml(trimmed)}</p>`);
    });

    closeList();
    if (inCode) {
      blocks.push("</code></pre>");
    }
    return blocks.join("");
  }

  function initTabs() {
    qsa(document, "[data-tabs]").forEach((tabs) => {
      const triggers = qsa(tabs, "[data-tab-trigger]");
      const panels = qsa(tabs, "[data-tab-panel]");
      if (!triggers.length || !panels.length) return;

      const activate = (name) => {
        triggers.forEach((trigger) => {
          const active = trigger.dataset.tabTrigger === name;
          trigger.classList.toggle("is-active", active);
          trigger.setAttribute("aria-pressed", String(active));
        });
        panels.forEach((panel) => {
          panel.classList.toggle("is-hidden", panel.dataset.tabPanel !== name);
        });
      };

      triggers.forEach((trigger) => {
        trigger.addEventListener("click", () => activate(trigger.dataset.tabTrigger));
      });

      const initial = triggers.find((trigger) => trigger.classList.contains("is-active"))?.dataset.tabTrigger ||
        triggers[0].dataset.tabTrigger;
      activate(initial);
    });
  }

  function initToggleTargets() {
    qsa(document, "[data-toggle-target]").forEach((toggle) => {
      const target = document.getElementById(toggle.dataset.toggleTarget);
      if (!target) return;

      toggle.addEventListener("click", () => {
        const shouldShow = target.classList.contains("is-hidden");
        target.classList.toggle("is-hidden", !shouldShow);
        toggle.setAttribute("aria-expanded", String(shouldShow));
      });
    });

    qsa(document, "[data-close-parent]").forEach((closeButton) => {
      closeButton.addEventListener("click", () => {
        const parent = closeButton.closest("[data-overlay]");
        if (parent) parent.classList.add("is-hidden");
      });
    });

    qsa(document, "[data-overlay]").forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          overlay.classList.add("is-hidden");
        }
      });
    });
  }

  function initActions() {
    qsa(document, "[data-action-message]").forEach((button) => {
      button.addEventListener("click", () => showToast(button.dataset.actionMessage));
    });

    qsa(document, "[data-copy-target]").forEach((button) => {
      const target = document.getElementById(button.dataset.copyTarget);
      if (!target) return;

      button.addEventListener("click", async () => {
        const payload = target.innerText || target.textContent || "";
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload);
          } else {
            const range = document.createRange();
            range.selectNodeContents(target);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            document.execCommand("copy");
            selection?.removeAllRanges();
          }
          showToast(button.dataset.successMessage || "已复制");
        } catch (error) {
          showToast("复制失败，请手动选择");
        }
      });
    });
  }

  function initFilterGroups() {
    qsa(document, "[data-filter-group]").forEach((group) => {
      const input = qs(group, "[data-filter-input]");
      const chips = qsa(group, "[data-filter-chip]");
      const items = qsa(group, "[data-filter-item]");

      const applyFilter = () => {
        const keyword = input ? input.value.trim().toLowerCase() : "";
        const activeChip = chips.find((chip) => chip.classList.contains("is-active"))?.dataset.filterChip || "all";

        items.forEach((item) => {
          const text = (item.dataset.filterText || item.textContent || "").toLowerCase();
          const tags = (item.dataset.filterTags || "").toLowerCase().split(" ");
          const matchesKeyword = !keyword || text.includes(keyword);
          const matchesChip = activeChip === "all" || tags.includes(activeChip);
          item.classList.toggle("is-hidden", !(matchesKeyword && matchesChip));
        });
      };

      if (input) input.addEventListener("input", applyFilter);
      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          chips.forEach((current) => current.classList.toggle("is-active", current === chip));
          applyFilter();
        });
      });

      applyFilter();
    });
  }

  function initSelectableCards() {
    qsa(document, "[data-select-group]").forEach((group) => {
      const cards = qsa(group, "[data-select-id]");
      const detailMap = {};

      qsa(group, "template[data-detail-template]").forEach((template) => {
        detailMap[template.dataset.detailTemplate] = template.innerHTML.trim();
      });

      const detailTarget = qs(group, "[data-select-detail]");
      if (!detailTarget || !cards.length) return;

      const activate = (id) => {
        cards.forEach((card) => card.classList.toggle("is-selected", card.dataset.selectId === id));
        if (detailMap[id]) {
          detailTarget.innerHTML = detailMap[id];
        }
      };

      cards.forEach((card) => {
        card.addEventListener("click", () => activate(card.dataset.selectId));
      });

      activate(cards[0].dataset.selectId);
    });
  }

  function initWaitlists() {
    qsa(document, "form[data-waitlist]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = qs(form, "input[type='email']");
        if (!email || !email.value.includes("@")) {
          showToast("请输入可用邮箱");
          email?.focus();
          return;
        }
        showToast("已加入体验名单");
        form.reset();
      });
    });
  }

  function initMirrors() {
    qsa(document, "[data-preview-source]").forEach((source) => {
      const target = document.getElementById(source.dataset.previewSource);
      const counter = source.dataset.wordcountTarget ? document.getElementById(source.dataset.wordcountTarget) : null;
      if (!target) return;

      const update = () => {
        target.innerHTML = renderSimpleMarkdown(source.value);
        if (counter) {
          const words = source.value
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          counter.textContent = `${words} words`;
        }
      };

      source.addEventListener("input", update);
      update();
    });
  }

  function initSwitches() {
    qsa(document, ".switch").forEach((switchEl) => {
      switchEl.addEventListener("click", () => {
        const checked = switchEl.getAttribute("aria-checked") === "true";
        switchEl.setAttribute("aria-checked", String(!checked));
      });
    });
  }

  function initRipple() {
    const selector =
      ".btn, .sidebar-link, .chip, .segmented button, .article-card, .feature-card, .work-card, .library-card, .result-card, .launcher-card, .asset-card, .kanban-card";
    document.addEventListener("pointerdown", (event) => {
      const host = event.target.closest(selector);
  if (!host) return;
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement("span");
  ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      if (getComputedStyle(host).position === "static") {
        host.style.position = "relative";
      }
      host.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }

  function initReveal() {
    const targets = qsa(
      document,
      "main > section, .workspace-main > *, .article-layout > *"
 );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    targets.forEach((el) => el.classList.add("reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
    observer.unobserve(entry.target);
        });
    },
  { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((el, index) => {
      el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 60}ms`);
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initToggleTargets();
    initActions();
    initFilterGroups();
    initSelectableCards();
    initWaitlists();
    initMirrors();
    initSwitches();
    initRipple();
    initReveal();
});

  window.tzblogUI = {
    showToast,
    renderSimpleMarkdown,
  };
})();
