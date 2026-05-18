import { auth } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-sm text-[hsl(var(--muted))]">
        Welcome back, {session?.user?.email}
      </p>
    </div>
  );
}
