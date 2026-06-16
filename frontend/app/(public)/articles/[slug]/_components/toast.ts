/**
 * 终端风格 toast —— 1:1 还原原型 front-article-tutorial.html 内联 JS 的 [data-msg] 行为。
 * 居中底部弹出，2s 后自动移除。文案以 textContent 注入，无 XSS。
 */
export function showToast(message: string): void {
  if (typeof document === 'undefined') return;
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText =
    'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
    'background:#11171f;border:1px solid #2a343f;color:#3fe08f;' +
    'font:13px/1.5 "JetBrains Mono",monospace;padding:10px 16px;' +
    'border-radius:8px;z-index:99;box-shadow:0 12px 40px rgba(0,0,0,.5)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
