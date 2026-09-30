import type { MetadataRoute } from "next";
import { activeTours, getSiteData } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const data = await getSiteData();
  const modified = data.publishedAt ? new Date(data.publishedAt) : new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/es`, lastModified: modified, changeFrequency: "weekly", priority: 1, alternates: { languages: { es: `${base}/es`, en: `${base}/en` } } },
    { url: `${base}/en`, lastModified: modified, changeFrequency: "weekly", priority: 0.9, alternates: { languages: { es: `${base}/es`, en: `${base}/en` } } },
  ];
  for (const t of activeTours(data)) {
    for (const lang of ["es", "en"] as const) {
      pages.push({
        url: `${base}/${lang}/tours/${t.slug}`,
        lastModified: modified,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: { languages: { es: `${base}/es/tours/${t.slug}`, en: `${base}/en/tours/${t.slug}` } },
      });
    }
  }
  return pages;
}
