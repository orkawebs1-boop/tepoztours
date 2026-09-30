import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = await siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: `${host}/sitemap.xml`,
  };
}
