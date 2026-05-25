import { ChannelForm } from "@/components/admin/channels/ChannelForm";

export default function ChannelCreatePage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">新建频道</h1>
      </header>

      <ChannelForm />
    </div>
  );
}
