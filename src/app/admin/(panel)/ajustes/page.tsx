import { loadSettings } from "@/lib/admin/load";
import { AjustesClient } from "./Client";

export default async function AjustesPage() {
  return <AjustesClient initial={await loadSettings()} />;
}
