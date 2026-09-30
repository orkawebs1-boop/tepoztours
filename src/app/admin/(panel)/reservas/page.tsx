import { loadReservas } from "@/lib/admin/load";
import { ReservasClient } from "./Client";

export default async function ReservasPage() {
  return <ReservasClient initial={await loadReservas()} />;
}
