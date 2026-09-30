import { blankTour, TourForm } from "@/components/admin/TourForm";
import { supabaseServer } from "@/lib/supabase/server";

export default async function NewTourPage() {
  const sb = await supabaseServer();
  const { data } = await sb.from("tours").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return <TourForm initial={blankTour(Number(data?.sort_order ?? 0) + 1)} isNew />;
}
