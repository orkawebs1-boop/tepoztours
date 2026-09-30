import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { NoAccess } from "@/components/admin/NoAccess";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await sb.from("admins").select("email").maybeSingle();
  if (!admin) return <NoAccess email={user.email ?? ""} />;

  const [tours, pending, state, snap] = await Promise.all([
    sb.from("tours").select("id", { count: "exact", head: true }),
    sb.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    sb.from("site_state").select("draft_changed_at").eq("id", 1).maybeSingle(),
    sb.from("site_snapshots").select("published_at").order("published_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <AdminShell
      email={user.email ?? ""}
      initialCounts={{ tours: tours.count ?? 0, pending: pending.count ?? 0 }}
      initialStatus={{
        draftChangedAt: (state.data?.draft_changed_at as string) ?? null,
        publishedAt: (snap.data?.published_at as string) ?? null,
      }}
    >
      {children}
    </AdminShell>
  );
}
