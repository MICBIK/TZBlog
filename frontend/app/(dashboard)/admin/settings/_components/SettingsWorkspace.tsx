'use client';

/**
 * 站点设置工作区 —— 1:1 还原原型 admin-settings.html 的交互核心。
 * 还原原型内联 JS：
 *  - 任意 input/textarea/select 的 change/input 冒泡到容器 → mark() 标脏，
 *    savebar 状态切「● 有未保存的更改」。
 *  - 顶栏「保存更改」与 savebar「保存更改」共用 save()：清脏 + 状态置「已保存 · 刚刚」+ toast。
 *  - 顶栏 / savebar 主按钮带磷光绿点击涟漪（复用后台共享 ripple）。
 */
import { useCallback, useState } from 'react';
import Link from 'next/link';

import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';
import { Field } from './Field';
import { SECTIONS } from './settings-data';

const SAVED_INIT = '已保存 · 最后更新 3 分钟前';

export function SettingsWorkspace() {
  const [dirty, setDirty] = useState(false);
  const [savedText, setSavedText] = useState(SAVED_INIT);

  const mark = useCallback(() => setDirty(true), []);
  const save = useCallback(() => {
    setDirty(false);
    setSavedText('已保存 · 刚刚');
    adminToast('设置已保存');
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶栏 */}
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-line bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-dim">
          admin ❯ <b className="font-normal text-[#aab3c0]">settings</b>
        </div>
        <div className="flex items-center gap-[10px]">
          <Link
            href="/"
            className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-line bg-panel px-[13px] py-[7px] font-mono text-[12.5px] text-[#aab3c0] transition-[.15s] hover:border-[#46505e] hover:text-fg"
          >
            ↗ 预览站点
          </Link>
          <button
            type="button"
            onClick={(e) => {
              ripple(e);
              save();
            }}
            className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/18"
          >
            ✓ 保存更改
          </button>
        </div>
      </header>

      {/* 表单区：任意控件变更冒泡到此 → 标脏 */}
      <div
        onChange={mark}
        onInput={mark}
        className="w-full max-w-[880px] px-[26px] pb-10 pt-6"
      >
        {SECTIONS.map((sec) => (
          <section
            key={sec.title}
            className={`mb-[18px] overflow-hidden rounded-[11px] border bg-panel ${
              sec.danger ? 'border-[rgba(224,106,90,0.3)]' : 'border-line'
            }`}
          >
            <div
              className={`flex items-center gap-[9px] border-b px-[18px] py-[13px] ${
                sec.danger ? 'border-[rgba(224,106,90,0.2)]' : 'border-line'
              }`}
            >
              <span className="font-mono text-[12.5px] text-[#aab3c0]">
                <b
                  className={`font-normal ${sec.danger ? 'text-destructive' : 'text-acc'}`}
                >
                  {sec.mark}
                </b>{' '}
                {sec.title}
              </span>
              {sec.desc && (
                <span className="font-mono text-[11px] text-muted">
                  {sec.desc}
                </span>
              )}
            </div>
            {sec.fields.map((f) => (
              <Field key={f.k} def={f} />
            ))}
          </section>
        ))}
      </div>

      {/* 保存条：sticky 底部 */}
      <div className="sticky bottom-0 mt-[6px] flex items-center justify-between border-t border-line bg-[rgba(13,18,25,0.85)] px-[26px] py-[13px] backdrop-blur-[8px]">
        <span className="font-mono text-[11.5px] text-muted">
          {dirty ? (
            <b className="font-normal text-amber">● 有未保存的更改</b>
          ) : (
            savedText
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            ripple(e);
            save();
          }}
          className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/18"
        >
          ✓ 保存更改
        </button>
      </div>
    </div>
  );
}
