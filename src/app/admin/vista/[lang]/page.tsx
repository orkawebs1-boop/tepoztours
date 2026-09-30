import { notFound, redirect } from "next/navigation";
import { EditOverlay } from "@/components/admin/EditOverlay";
import { HomeView } from "@/components/site/HomeView";
import { loadDraftSite } from "@/lib/admin/load";
import { colorVars } from "@/lib/colors";
import { isLang } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Vista previa del borrador para el editor visual (solo administradores). */
export default async function PreviewPage({ params }: PageProps<"/admin/vista/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await sb.from("admins").select("email").maybeSingle();
  if (!admin) notFound();

  const data = await loadDraftSite();
  return (
    <div lang={lang} style={{ ...(colorVars(data.settings.colors) as React.CSSProperties), background: "var(--cream)" }}>
      <HomeView data={data} lang={lang} preview />
      <EditOverlay lang={lang} />
    </div>
  );
}
