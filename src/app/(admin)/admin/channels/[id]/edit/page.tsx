import { notFound } from "next/navigation";

import { ChannelForm } from "@/components/admin/channels/ChannelForm";
import { getChannelById } from "@/lib/services/channels";

type Props = { params: Promise<{ id: string }> };

export default async function ChannelEditPage({ params }: Props) {
  const { id } = await params;
  const channel = await getChannelById(id);
  if (!channel) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">编辑频道</h1>
      </header>

      <ChannelForm
        mode="edit"
        initial={{
          id: channel.id,
          slug: channel.slug,
          kind: channel.kind,
          layout: channel.layout,
          enabled: channel.enabled,
          translations: channel.translations,
        }}
      />
    </div>
  );
}
