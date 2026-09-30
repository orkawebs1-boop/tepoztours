import Link from "next/link";
import { TourForm } from "@/components/admin/TourForm";
import { tourFromRow } from "@/lib/admin/rows";
import { supabaseServer } from "@/lib/supabase/server";

export default async function EditTourPage({ params }: PageProps<"/admin/tours/[id]">) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data } = await sb.from("tours").select("*").eq("id", id).maybeSingle();
  if (!data) {
    return (
      <div className="ad-empty">
        <span className="ad-empty-txt">
          <strong>No encontramos este tour</strong>
          <span>Puede que se haya eliminado.</span>
        </span>
        <Link className="ad-btn ad-btn-amber" href="/admin/tours">
          Ver todos los tours
        </Link>
      </div>
    );
  }
  return <TourForm key={id} initial={tourFromRow(data)} isNew={false} />;
}
