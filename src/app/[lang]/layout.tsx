import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { colorVars } from "@/lib/colors";
import { getDictionary, isLang } from "@/lib/i18n";
import { getSiteData } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import { barlow, hanken } from "../fonts";
import "../globals.css";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#1F3A2E",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const data = await getSiteData();
  const dict = getDictionary(lang, data.texts);
  const tour = data.tours.find((t) => t.active && t.photos[0]?.url);
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: dict.meta.title, template: `%s · ${data.settings.name}` },
    description: dict.meta.description,
    alternates: { languages: { es: "/es", en: "/en" } },
    openGraph: {
      type: "website",
      siteName: data.settings.name,
      locale: lang === "es" ? "es_MX" : "en_US",
      title: dict.meta.title,
      description: dict.meta.description,
      images: tour?.photos[0]?.url ? [tour.photos[0].url] : undefined,
    },
    icons: { icon: "/icon.svg" },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const data = await getSiteData();
  const dict = getDictionary(lang, data.texts);
  return (
    <html lang={lang} className={`${barlow.variable} ${hanken.variable}`}>
      <body style={colorVars(data.settings.colors) as React.CSSProperties}>
        <a className="skip-link" href="#contenido">
          {dict.nav.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
