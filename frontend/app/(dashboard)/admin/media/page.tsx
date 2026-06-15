import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '媒体库 - 后台管理',
  description: 'TZBlog 后台媒体库',
};

export default function MediaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[5] flex items-center justify-between border-b border-[#1d2530] bg-[rgba(13,18,25,0.7)] px-[26px] py-[14px] backdrop-blur-[8px]">
        <div className="font-mono text-[12px] text-muted">
          admin ❯ <b className="text-[#aab3c0] font-normal">media</b>
        </div>
        <button className="flex items-center gap-[6px] rounded-[7px] border border-acc-dim bg-acc/12 px-[13px] py-[7px] font-mono text-[12.5px] text-acc transition-[.15s] hover:bg-acc/18">
          ⬆ 上传
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-[26px] py-10">
        <div className="text-center">
          <div className="text-acc mb-4 font-mono text-[13px]">
            $ ls -lh media/
          </div>
          <p className="text-muted font-sans text-[14px]">媒体库即将上线</p>
          <p className="text-dim mt-2 font-sans text-[13px]">
            后端 API 联调后将支持图片上传、管理和预览
          </p>
        </div>
      </div>
    </div>
  );
}
