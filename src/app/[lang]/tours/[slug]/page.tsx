import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmt, isLang, otherLang } from "@/lib/i18n";
import { buildChrome, buildDetail, getSiteData } from "@/lib/site";
import { BrandIcon, Icon, type IconName } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { DetailGallery } from "@/components/site/DetailGallery";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { TourCard } from "@/components/site/TourCard";
import { WaFloat } from "@/components/site/WaFloat";
import s from "./detail.module.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/tours/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const detail = buildDetail(await getSiteData(), lang, slug);
  if (!detail) return {};
  const cover = detail.photos[0]?.url;
  return {
    title: detail.tour.name,
    description: detail.tour.short,
    alternates: {
      canonical: `/${lang}/tours/${slug}`,
      languages: { es: `/es/tours/${slug}`, en: `/en/tours/${slug}` },
    },
    openGraph: { title: detail.tour.name, description: detail.tour.short, images: cover ? [cover] : undefined },
  };
}

export default async function TourPage({ params }: PageProps<"/[lang]/tours/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const data = await getSiteData();
  const detail = buildDetail(data, lang, slug);
  if (!detail) notFound();
  const chrome = buildChrome(data, lang);
  const { dict, tour } = detail;
  const altHref = `/${otherLang(lang)}/tours/${slug}`;

  const summary: { icon: IconName; k: string; v: string; short?: string; desktopOnly?: boolean }[] = [
    { icon: "clock", k: dict.detail.duration, v: detail.durationLong },
    { icon: "mountain", k: dict.detail.difficulty, v: tour.diff },
    { icon: "group", k: dict.detail.group, v: detail.groupLong, short: detail.groupShort },
    { icon: "sun", k: dict.detail.departure, v: detail.departureTime },
    { icon: "pin", k: dict.detail.meeting, v: detail.meetingPoint, desktopOnly: true },
  ];

  const cardLabels = {
    from: dict.common.from,
    perPerson: dict.common.perPerson,
    viewDetails: dict.common.viewDetails,
    book: dict.common.book,
    photo: dict.common.photo,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: tour.short,
    image: detail.photos.map((p) => p.url).filter(Boolean),
    touristType: tour.catLabel,
    offers: { "@type": "Offer", price: tour.price, priceCurrency: "MXN", availability: "https://schema.org/InStock" },
    provider: { "@type": "TravelAgency", name: chrome.name, address: "Tepoztlán, Morelos, México" },
    itinerary: {
      "@type": "ItemList",
      itemListElement: detail.itinerary.map((st, i) => ({ "@type": "ListItem", position: i + 1, name: `${st.time} · ${st.title}` })),
    },
  };

  return (
    <>
      <div className={s.headerWrap}>
        <Header lang={lang} dict={dict} chrome={chrome} variant="solid" active="tours" altHref={altHref} waHref={tour.wa} />
      </div>

      <main id="contenido" className={s.page}>
        <div className={`tt-section ${s.top}`}>
          <div className="tt-wrap">
            <nav className={s.crumb} aria-label={dict.detail.crumb}>
              <Link href={`/${lang}`}>{dict.nav.home}</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/${lang}#tours`}>{dict.nav.tours}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className={s.crumbNow}>
                {tour.name}
              </span>
            </nav>
            <div className={s.titleRow}>
              <div className={s.titleCol}>
                <Chips cat={tour.catLabel} badge={detail.badge} />
                <h1 className={`tt-d ${s.h1}`}>{tour.name}</h1>
              </div>
              <Link className="tt-btn tt-btn-ghost" href={`/${lang}#tours`}>
                <Icon name="chevLeft" />
                {dict.detail.allTours}
              </Link>
            </div>
          </div>
        </div>

        <DetailGallery photos={detail.photos} name={tour.name} dict={dict} lang={lang} altHref={altHref} />

        <div className={s.sheet}>
          {/* Encabezado móvil (dentro de la hoja que sube sobre la foto) */}
          <div className={s.mobHead}>
            <Chips cat={tour.catLabel} badge={detail.badge} small />
            <h1 className={`tt-d ${s.mobH1}`}>{tour.name}</h1>
          </div>

          <div className={`tt-section ${s.sumWrap}`}>
            <div className={`tt-wrap ${s.summary}`}>
              {summary.map((it) => (
                <div key={it.k} className={`${s.sum} ${it.desktopOnly ? s.deskOnly : ""}`}>
                  <span className={s.sumIco}>
                    <Icon name={it.icon} />
                  </span>
                  <span>
                    <span className={s.sumK}>{it.k}</span>
                    <span className={s.sumV}>
                      {it.short ? (
                        <>
                          <span className={s.long}>{it.v}</span>
                          <span className={s.short}>{it.short}</span>
                        </>
                      ) : (
                        it.v
                      )}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`tt-section ${s.bodyWrap}`}>
            <div className={`tt-wrap ${s.body}`}>
              <div className={s.content}>
                <section className={s.block}>
                  <div className={`tt-eyebrow ${s.deskOnly}`}>{dict.detail.aboutTour}</div>
                  <h2 className={`tt-d ${s.h2}`}>{dict.detail.description}</h2>
                  {detail.description.map((p, i) => (
                    <p key={i} className={s.p}>
                      {p}
                    </p>
                  ))}
                </section>

                {detail.itinerary.length > 0 && (
                  <section className={s.block}>
                    <h2 className={`tt-d ${s.h2}`}>{dict.detail.itinerary}</h2>
                    <ol className={s.steps}>
                      {detail.itinerary.map((st, i) => (
                        <li key={i} className={`${s.step} ${i === detail.itinerary.length - 1 ? s.isLast : ""}`}>
                          <span className={`${s.stepTime} ${s.deskTime}`}>{st.time}</span>
                          <span className={s.rail}>
                            <span className={s.dot} />
                            <span className={s.line} />
                          </span>
                          <div className={s.stepBody}>
                            <span className={`${s.stepTime} ${s.mobTime}`}>{st.time}</span>
                            <h3 className={s.stepT}>{st.title}</h3>
                            <p className={s.stepD}>{st.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <section className={s.lists}>
                  <div className={`${s.listCard} ${s.includes}`}>
                    <h2 className="tt-d">{dict.detail.includes}</h2>
                    <ul>
                      {detail.includes.map((x) => (
                        <li key={x}>
                          <span className={s.liIco}>
                            <Icon name="check" />
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${s.listCard} ${s.bring}`}>
                    <h2 className="tt-d">{dict.detail.bring}</h2>
                    <ul>
                      {detail.bring.map((x) => (
                        <li key={x}>
                          <span className={s.liIco}>
                            <Icon name="plus" />
                          </span>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Vista previa del mensaje en móvil */}
                <section className={s.mobMsg}>
                  <span className={s.msgLabel}>{dict.detail.waWillOpenMobile}</span>
                  <div className={s.bubble}>{detail.waMessage}</div>
                  <span className={s.lockNote}>
                    <Icon name="lock" size={16} />
                    {dict.detail.noPaymentsShort}
                  </span>
                </section>
              </div>

              <aside className={s.book} aria-label={dict.common.book}>
                <div className={s.bookPrice}>
                  <span className={s.fromLbl}>{dict.common.from}</span>
                  <div className={s.priceLine}>
                    <span className="tt-d">{tour.priceTxt}</span>
                    <span>{dict.detail.perPerson}</span>
                  </div>
                </div>
                <div className={s.rows}>
                  <div className={s.row}>
                    <span>{dict.detail.duration}</span>
                    <strong>{detail.durationLong}</strong>
                  </div>
                  <div className={s.row}>
                    <span>{dict.detail.difficulty}</span>
                    <strong>{tour.diff}</strong>
                  </div>
                  <div className={s.row}>
                    <span>{dict.detail.departures}</span>
                    <strong>{detail.scheduleDays}</strong>
                  </div>
                  <div className={s.row}>
                    <span>{dict.detail.minAge}</span>
                    <strong>{detail.minAge}</strong>
                  </div>
                </div>
                <a className={`tt-btn tt-btn-amber ${s.bookBtn}`} href={tour.wa} target="_blank" rel="noopener">
                  <BrandIcon name="whatsapp" size={22} />
                  {dict.common.bookWa}
                </a>
                <div className={s.msg}>
                  <span className={s.msgLabel}>{dict.detail.waWillOpen}</span>
                  <div className={s.bubble}>{detail.waMessage}</div>
                </div>
                <div className={s.note}>
                  <Icon name="lock" />
                  <span>{dict.detail.noPayments}</span>
                </div>
              </aside>
            </div>
          </div>

          {detail.related.length > 0 && (
            <section className={`tt-section ${s.related}`}>
              <div className="tt-wrap">
                <div className={s.relHead}>
                  <div className={`tt-eyebrow ${s.deskOnly}`}>{dict.detail.keepExploring}</div>
                  <h2 className={`tt-d ${s.h2} ${s.relTitle}`}>{dict.detail.related}</h2>
                </div>
                <div className={s.relGrid}>
                  {detail.related.map((x) => (
                    <TourCard key={x.id} tour={x} labels={cardLabels} imgHeight={196} />
                  ))}
                  <Link href={`/${lang}#tours`} className={s.allCard}>
                    <LogoMark size={64} hill="#F6EFE3" pyramid={false} />
                    <span className={s.allText}>
                      <span className="tt-d">{fmt(dict.detail.seeAll, { n: detail.totalTours })}</span>
                      <span className={s.allLink}>
                        {dict.detail.browse}
                        <Icon name="arrowRight" />
                      </span>
                    </span>
                  </Link>
                </div>
                {/* Carrusel horizontal en móvil */}
                <div className={s.relScroll}>
                  {detail.related.map((x) => (
                    <article key={x.id} className={s.rcard}>
                      <Link href={x.href} className={`tt-ph ${s.rImg}`} style={{ backgroundColor: x.tone }} aria-label={x.name}>
                        {x.cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="tt-img" src={x.cover} alt="" loading="lazy" decoding="async" />
                        )}
                      </Link>
                      <div className={s.rBody}>
                        <h3 className="tt-d">
                          <Link href={x.href}>{x.name}</Link>
                        </h3>
                        <span className={s.rMeta}>
                          {x.dur} · {x.diff} · <strong>{x.priceTxt}</strong>
                        </span>
                        <a className="tt-btn tt-btn-amber" href={x.wa} target="_blank" rel="noopener">
                          <BrandIcon name="whatsapp" />
                          {dict.common.book}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer lang={lang} dict={dict} chrome={chrome} compact />

      {/* Barra fija de reserva (móvil) */}
      <div className={s.bar}>
        <div className={s.barPrice}>
          <span className={s.fromLbl}>{dict.common.from}</span>
          <span className={s.barLine}>
            <span className="tt-d">{tour.priceTxt}</span>
            <span>{dict.common.perPerson}</span>
          </span>
        </div>
        <a className={`tt-btn tt-btn-amber ${s.barBtn}`} href={tour.wa} target="_blank" rel="noopener">
          <BrandIcon name="whatsapp" />
          {dict.common.book}
        </a>
      </div>

      <WaFloat href={tour.wa} label={dict.common.waFloat} hideOnMobile />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

function Chips({ cat, badge, small = false }: { cat: string; badge: string; small?: boolean }) {
  return (
    <div className={`${s.chips} ${small ? s.chipsSm : ""}`}>
      <span className={s.chipDark}>{cat}</span>
      {badge && <span className={s.chipSand}>{badge}</span>}
    </div>
  );
}
