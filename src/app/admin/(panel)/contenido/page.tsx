import { loadContenido } from "@/lib/admin/load";
import { ContenidoClient } from "./Client";

export default async function ContenidoPage() {
  return <ContenidoClient initial={await loadContenido()} />;
}
