"use client";

import { useEffect, useState } from "react";
import { BrandIcon } from "../icons";
import s from "./WaFloat.module.css";

/**
 * Botón flotante de WhatsApp.
 * - En el detalle móvil se oculta: ahí la barra fija de reserva cumple esa función (`hideOnMobile`).
 * - En móvil y tablet se oculta mientras el hero está a la vista, porque ahí ya
 *   hay un botón de reservar y el flotante taparía el contador del carrusel.
 */
export function WaFloat({
  href,
  label,
  hideOnMobile = false,
  hideOverHero = false,
}: {
  href: string;
  label: string;
  hideOnMobile?: boolean;
  hideOverHero?: boolean;
}) {
  const [overHero, setOverHero] = useState(hideOverHero);

  useEffect(() => {
    if (!hideOverHero) return;
    const hero = document.getElementById("inicio");
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setOverHero(entry.intersectionRatio > 0.25), {
      threshold: [0, 0.25, 0.5, 1],
    });
    io.observe(hero);
    return () => io.disconnect();
  }, [hideOverHero]);

  return (
    <a
      className={`${s.float} ${hideOnMobile ? s.hideMobile : ""} ${overHero ? s.overHero : ""}`}
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={label}
    >
      <BrandIcon name="whatsapp" />
    </a>
  );
}
