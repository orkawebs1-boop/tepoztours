import { loadTours } from "@/lib/admin/load";
import { ToursClient } from "./Client";

export default async function ToursPage() {
  return <ToursClient initial={await loadTours()} />;
}
