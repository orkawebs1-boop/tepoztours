import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { getSiteData } from "@/lib/site";
import { HomeView } from "@/components/site/HomeView";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomeView data={await getSiteData()} lang={lang} />;
}
