'use client';

import { useSyncExternalStore } from 'react';

/** 永不变更的订阅（路径只在首帧客户端读取一次）*/
function subscribe() {
  return () => {};
}

/** 客户端快照：读取访问者实际命中的路径 */
function getClientSnapshot(): string {
  try {
    const from =
      new URLSearchParams(location.search).get('from') ||
      document.referrer ||
      location.pathname;
    return from.slice(0, 60) || 'requested-page';
  } catch {
    return 'requested-page';
  }
}

/** 服务端 / 首帧快照：占位文案，避免 hydration 不一致 */
function getServerSnapshot(): string {
  return 'requested-page';
}

/**
 * 还原原型 404.html 末尾内联 JS（第 75-78 行）：
 * 把访问者实际命中的路径回显到 `cat <arg>`。
 * 优先级：?from= 查询参数 → document.referrer → location.pathname。
 * 截断 60 字符；空则回退 'requested-page'。
 */
export function RequestedPath() {
  const path = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <span className="text-amber" id="reqpath">
      {path}
    </span>
  );
}
