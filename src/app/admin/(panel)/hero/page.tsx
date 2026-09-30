import { loadHero } from "@/lib/admin/load";
import { HeroClient } from "./Client";

export default async function HeroPage() {
  return <HeroClient initial={await loadHero()} />;
}
