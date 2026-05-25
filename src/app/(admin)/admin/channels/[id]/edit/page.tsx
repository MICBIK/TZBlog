import { ChannelForm } from "@/components/admin/channels/ChannelForm";

type Props = { params: Promise<{ id: string }> };

export default async function ChannelEditPage({ params }: Props) {
  await params;

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">编辑频道</h1>
      </header>

      <ChannelForm />
    </div>
  );
}
