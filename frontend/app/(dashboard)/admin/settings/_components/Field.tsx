'use client';

/**
 * 站点设置字段原语 —— 1:1 还原原型 admin-settings.html 的 .field 行与各控件。
 * 控件全部非受控（defaultValue/defaultChecked），脏态由容器事件冒泡捕获（见 SettingsWorkspace）。
 * 危险操作按钮带磷光绿涟漪 + toast，复用后台共享 ripple / adminToast。
 */
import { adminToast } from '../../_components/adminToast';
import { ripple } from '../../_components/ripple';
import type { FieldDef } from './settings-data';

const INPUT_CLS =
  'w-full max-w-[340px] resize-y rounded-[7px] border border-line bg-panel2 px-[11px] py-2 font-mono text-[12.5px] text-fg transition-[.15s] focus:border-acc-dim focus:shadow-[0_0_0_3px_rgba(63,224,143,0.08)]';

function Tag({ text, variant }: NonNullable<FieldDef['tag']>) {
  const cls =
    variant === 'pri'
      ? 'text-acc border-acc-dim bg-acc/8'
      : 'text-[#46505e] border-line';
  return (
    <span
      className={`ml-[7px] inline-block rounded-[5px] border px-[7px] py-[2px] font-mono text-[10.5px] ${cls}`}
    >
      {text}
    </span>
  );
}

function Switch({ checked }: { checked?: boolean }) {
  return (
    <label className="relative h-6 w-[42px] flex-none">
      <input
        type="checkbox"
        defaultChecked={checked}
        className="peer absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer opacity-0"
      />
      {/* 轨道 */}
      <span className="absolute inset-0 rounded-[13px] border border-line bg-panel2 transition-all duration-[180ms] peer-checked:border-acc-dim peer-checked:bg-acc/15" />
      {/* 旋钮 */}
      <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-muted-foreground transition-all duration-[180ms] peer-checked:left-[21px] peer-checked:bg-acc peer-checked:shadow-[0_0_8px_var(--acc)]" />
    </label>
  );
}

function Control({ ctl }: { ctl: FieldDef['ctl'] }) {
  switch (ctl.kind) {
    case 'text':
      return (
        <input
          type="text"
          defaultValue={ctl.value}
          placeholder={ctl.placeholder}
          className={INPUT_CLS}
        />
      );
    case 'textarea':
      return (
        <textarea rows={ctl.rows ?? 2} defaultValue={ctl.value} className={INPUT_CLS} />
      );
    case 'select':
      return (
        <select defaultValue={ctl.options[0]} className={INPUT_CLS}>
          {ctl.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case 'switch':
      return <Switch checked={ctl.checked} />;
    case 'pre':
      return (
        <span className="inline-flex items-center font-mono text-[12px] text-muted">
          {ctl.prefix}
          <i className="ml-1 not-italic text-acc">{ctl.em}</i>
        </span>
      );
    case 'button': {
      const variantCls =
        ctl.variant === 'warn'
          ? 'text-amber border-[rgba(232,179,57,0.4)] hover:bg-[rgba(232,179,57,0.08)]'
          : ctl.variant === 'dgr'
            ? 'text-destructive border-[rgba(224,106,90,0.4)] hover:bg-[rgba(224,106,90,0.08)]'
            : 'text-[#aab3c0] border-line hover:border-[#46505e] hover:text-fg';
      return (
        <button
          type="button"
          onClick={(e) => {
            ripple(e);
            adminToast(ctl.msg);
          }}
          className={`relative inline-flex items-center gap-[6px] overflow-hidden rounded-[7px] border bg-panel px-[13px] py-[7px] font-mono text-[12.5px] transition-[.15s] ${variantCls}`}
        >
          {ctl.label}
        </button>
      );
    }
  }
}

export function Field({ def }: { def: FieldDef }) {
  return (
    <div className="flex items-center justify-between gap-[18px] border-b border-panel2 px-[18px] py-[13px] last:border-b-0 max-[880px]:flex-col max-[880px]:items-stretch">
      <div className="max-w-[48%] flex-none max-[880px]:max-w-none">
        <div className="text-[13px] text-fg">
          {def.k}
          {def.tag && <Tag {...def.tag} />}
        </div>
        {def.h && (
          <div className="mt-[2px] text-[11.5px] text-muted">{def.h}</div>
        )}
      </div>
      <div className="flex flex-1 justify-end max-[880px]:justify-start">
        <Control ctl={def.ctl} />
      </div>
    </div>
  );
}
