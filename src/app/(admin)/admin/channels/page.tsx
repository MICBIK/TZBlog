import { ChannelsTable } from "@/components/admin/channels/ChannelsTable";
import { listChannels } from "@/lib/services/channels";

export default async function ChannelsAdminPage() {
  const channels = await listChannels();

  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">频道管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理内容频道与前台信息架构。
        </p>
      </header>

      <ChannelsTable initialChannels={channels} />
    </div>
  );
}
