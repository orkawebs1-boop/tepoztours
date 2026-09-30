import { loadPriceRows } from "@/lib/admin/load";
import { PreciosClient } from "./Client";

export default async function PreciosPage() {
  return <PreciosClient initial={await loadPriceRows()} />;
}
