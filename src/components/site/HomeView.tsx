import { otherLang } from "@/lib/i18n";
import { buildChrome, buildHome } from "@/lib/site";
import type { Lang, SiteData } from "@/lib/types";
import { About } from "./About";
import { Contact } from "./Contact";
import { Explore } from "./Explore";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { Gallery } from "./Gallery";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Testimonials } from "./Testimonials";
import { ToursSection } from "./ToursSection";
import { Trust } from "./Trust";
import { WaFloat } from "./WaFloat";

/**
 * Página de inicio completa. La usan el sitio público (datos publicados) y la
 * vista previa del editor del panel (datos del borrador, sin autoplay).
 */
export function HomeView({ data, lang, preview = false }: { data: SiteData; lang: Lang; preview?: boolean }) {
  const home = buildHome(data, lang);
  const chrome = buildChrome(data, lang);
  const { dict } = home;

  return (
    <>
      <div style={{ position: "relative" }}>
        <Header
          lang={lang}
          dict={dict}
          chrome={chrome}
          variant="overlay"
          active="inicio"
          altHref={preview ? `/admin/vista/${otherLang(lang)}` : `/${otherLang(lang)}`}
          waHref={chrome.waGeneral}
        />
        <Hero
          slides={home.slides}
          autoplay={preview ? false : data.settings.heroAutoplay}
          interval={data.settings.heroInterval}
          labels={{
            from: dict.common.from,
            mxn: dict.common.mxn,
            bookWa: dict.common.bookWa,
            viewDetails: dict.common.viewDetails,
            prev: dict.common.prevTour,
            next: dict.common.nextTour,
            viewTour: dict.common.viewTour,
          }}
        />
      </div>
      <main id="contenido">
        <Trust dict={dict} />
        <ToursSection tours={home.tours} dict={dict} />
        <Explore tours={home.tours} dict={dict} />
        <About dict={dict} guides={home.guides} photos={data.settings.aboutPhotos} />
        <Gallery dict={dict} items={home.gallery} instagram={data.settings.social.instagram} />
        <Testimonials dict={dict} items={home.testimonials} />
        <Faq dict={dict} faqs={home.faqs} waGeneral={chrome.waGeneral} />
        <Contact dict={dict} chrome={chrome} />
      </main>
      <Footer lang={lang} dict={dict} chrome={chrome} />
      <WaFloat href={chrome.waGeneral} label={dict.common.waFloat} hideOverHero />
    </>
  );
}
