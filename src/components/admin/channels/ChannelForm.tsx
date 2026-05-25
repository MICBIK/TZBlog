"use client";

export function ChannelForm() {
  return (
    <form className="grid gap-6">
      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">Slug</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">频道类型</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">布局</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">主题与强调</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">翻译</h2>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="text-base font-semibold">可见性</h2>
      </section>
    </form>
  );
}

export default ChannelForm;
