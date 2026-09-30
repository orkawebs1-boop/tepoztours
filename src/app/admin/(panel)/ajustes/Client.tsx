"use client";

import { useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import { L10nField, LangTabs, Switch, TextField } from "@/components/admin/fields";
import { BrandIcon, Icon, type BrandName } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { pickImages, uploadImage } from "@/lib/admin/upload";
import { DEFAULT_COLORS, isHex } from "@/lib/colors";
import { digits, waLink } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { BrandColors, Lang, Settings } from "@/lib/types";
import s from "./ajustes.module.css";

const COLOR_META: [keyof BrandColors, string, string][] = [
  ["forest", "Verde bosque", "Títulos, menú y pie de página"],
  ["terra", "Terracota", "Etiquetas y detalles"],
  ["amber", "Ámbar", "Botones de reservar"],
  ["sand", "Arena", "Fondos de apoyo"],
  ["cream", "Crema", "Fondo general"],
];
const SOCIAL: { key: keyof Settings["social"]; label: string; prefix: string; brand: BrandName }[] = [
  { key: "facebook", label: "Facebook", prefix: "facebook.com/", brand: "facebook" },
  { key: "instagram", label: "Instagram", prefix: "instagram.com/", brand: "instagram" },
  { key: "tiktok", label: "TikTok", prefix: "tiktok.com/@", brand: "tiktok" },
];

/** URL completa → usuario, y al revés. */
const toHandle = (url: string, prefix: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(prefix, "").replace(/\/$/, "");
const toUrl = (handle: string, prefix: string) => {
  const h = handle.trim().replace(/^@/, "");
  if (!h) return "";
  if (/^https?:\/\//.test(h)) return h;
  return `https://www.${prefix}${h}`;
};

export function AjustesClient({ initial }: { initial: Settings }) {
  const { toast, refreshStatus } = useAdmin();
  const [st, setSt] = useState<Settings>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [lang, setLang] = useState<Lang>("es");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const dirty = JSON.stringify(st) !== saved;
  const waDigits = digits(st.whatsapp);
  const waBad = waDigits.length > 0 && waDigits.length !== 10;

  const save = async (): Promise<boolean> => {
    if (waBad) {
      setTried(true);
      toast("err", "No se pudo guardar", "El número de WhatsApp debe tener 10 dígitos.");
      return false;
    }
    if (st.email && !/^\S+@\S+\.\S+$/.test(st.email)) {
      toast("err", "Revisa el correo", "Escribe un correo válido, por ejemplo hola@tudominio.mx.");
      return false;
    }
    setBusy(true);
    const next = { ...st, whatsapp: waDigits };
    const { error } = await supabaseBrowser().from("settings").update({ data: next }).eq("id", 1);
    setBusy(false);
    if (error) {
      toast("err", "No se pudo guardar", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
      return false;
    }
    setSt(next);
    setSaved(JSON.stringify(next));
    await refreshStatus();
    toast("ok", "Ajustes guardados", "Publica el sitio para aplicar los cambios.");
    return true;
  };

  usePageSave(dirty, save);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSt({ ...st, [k]: v });
  const c = { ...DEFAULT_COLORS, ...st.colors };
  const message = st.waMessage[lang] || st.waMessage.es;
  const link = waLink(st.whatsapp, message);

  const uploadLogo = async () => {
    const [file] = await pickImages(false);
    if (!file) return;
    try {
      const url = await uploadImage(file, "marca");
      set("logoUrl", url);
      toast("ok", "Logo subido", "Revisa cómo se ve sobre fondo claro y oscuro, y guarda.");
    } catch {
      toast("err", "No se pudo subir el logo", "Usa SVG o PNG de menos de 8 MB.");
    }
  };

  return (
    <div className={s.grid}>
      <div className={s.col}>
        <LangTabs lang={lang} onChange={setLang} />
        <section className={`ad-card ${s.card}`}>
          <h2 className={s.h}>Datos de la agencia</h2>
          <p className={s.sub}>Aparecen en el pie de página, en Contacto y en los avisos del sitio.</p>
          <div className={s.g2}>
            <TextField label="Nombre comercial" value={st.name} onChange={(v) => set("name", v)} />
            <L10nField label="Eslogan" value={st.slogan} lang={lang} onChange={(v) => set("slogan", v)} />
            <TextField label="Correo" type="email" value={st.email} onChange={(v) => set("email", v)} placeholder="hola@tudominio.mx" />
            <L10nField label="Horario de atención" value={st.hours} lang={lang} onChange={(v) => set("hours", v)} />
          </div>
          <L10nField label="Punto de encuentro" value={st.address} lang={lang} onChange={(v) => set("address", v)} help="Se usa también para el botón «Cómo llegar» del mapa." />
        </section>

        <section className={`ad-card ${s.card}`}>
          <h2 className={s.h}>WhatsApp general</h2>
          <p className={s.sub}>Todos los botones «Reservar» del sitio abren este número.</p>
          <div>
            <label className="ad-label" htmlFor="aj-wa">
              Número de WhatsApp
            </label>
            <div className={`${s.pre} ${waBad && tried ? s.bad : ""}`}>
              <span>
                <BrandIcon name="whatsapp" size={16} />
                +52
              </span>
              <input
                id="aj-wa"
                inputMode="numeric"
                placeholder="10 dígitos"
                value={st.whatsapp}
                aria-invalid={waBad || undefined}
                onChange={(e) => set("whatsapp", e.target.value)}
                onBlur={() => setTried(true)}
              />
            </div>
            {waBad && tried && (
              <span className="ad-err">
                <Icon name="info" />
                Escribe los 10 dígitos, sin espacios ni guiones.
              </span>
            )}
          </div>
          <L10nField label="Mensaje del botón flotante y del menú" value={st.waMessage} lang={lang} onChange={(v) => set("waMessage", v)} multiline rows={3} />
          <div className={s.waRow}>
            <span style={{ color: "#1DAA52", display: "flex" }}>
              <BrandIcon name="whatsapp" />
            </span>
            <span className={s.waUrl}>{link.replace("https://", "")}</span>
            <a className="ad-btn ad-btn-ghost" href={link} target="_blank" rel="noopener" style={{ height: 38 }}>
              Probar enlace
            </a>
          </div>
          <p className="ad-help">Los mensajes de cada tour se editan dentro del tour, en Tours › Editar.</p>
        </section>
      </div>

      <div className={s.col}>
        <section className={`ad-card ${s.card}`}>
          <h2 className={s.h}>Logo</h2>
          <div className={s.g2}>
            <div className={s.logo} style={{ backgroundColor: c.cream, border: "1px solid var(--line)", color: c.forest }}>
              {st.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={st.logoUrl} alt="Logo" className={s.logoImg} />
              ) : (
                <>
                  <LogoMark size={46} sun={c.amber} />
                  <span className="tt-d" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: ".03em" }}>
                    Tepoz<span style={{ color: c.terra }}>tours</span>
                  </span>
                </>
              )}
            </div>
            <div className={s.logo} style={{ backgroundColor: c.forest, color: c.cream }}>
              {st.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={st.logoUrl} alt="Logo sobre fondo oscuro" className={s.logoImg} />
              ) : (
                <>
                  <LogoMark size={46} sun={c.amber} />
                  <span className="tt-d" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, letterSpacing: ".03em" }}>
                    Tepoz<span style={{ color: c.amber }}>tours</span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className={s.logoRow}>
            <span className={s.fav}>
              <span className={s.favIco} style={{ backgroundColor: c.forest }}>
                <LogoMark size={28} sun={c.amber} hill={c.cream} />
              </span>
              <span className={s.favTxt}>
                <strong>Ícono de pestaña</strong>
                <span>Se genera a partir del logo</span>
              </span>
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ad-btn ad-btn-plain"
                onClick={() => {
                  set("logoUrl", null);
                  toast("ok", "Logo restablecido", "Se usa de nuevo el logo original del cerro y el sol.");
                }}
              >
                Restablecer
              </button>
              <button type="button" className="ad-btn ad-btn-forest" onClick={uploadLogo}>
                <Icon name="upload" />
                Subir logo
              </button>
            </span>
          </div>
          <p className="ad-help">SVG o PNG con fondo transparente, de al menos 512 px.</p>
        </section>

        <section className={`ad-card ${s.card}`}>
          <h2 className={s.h}>Colores</h2>
          <div className={s.colors}>
            <div className={s.colorList}>
              {COLOR_META.map(([k, name, use]) => (
                <label key={k} className={s.color}>
                  <input
                    type="color"
                    value={isHex(c[k]) ? c[k] : DEFAULT_COLORS[k]}
                    onChange={(e) => set("colors", { ...c, [k]: e.target.value.toUpperCase() })}
                    aria-label={`Color ${name}`}
                  />
                  <span className={s.colorTxt}>
                    <strong>{name}</strong>
                    <span>{use}</span>
                  </span>
                  <span className={s.hex}>{c[k].toUpperCase()}</span>
                </label>
              ))}
            </div>
            <div className={s.pv} style={{ backgroundColor: c.cream }}>
              <span className={s.pvK}>Vista previa</span>
              <span className="tt-d" style={{ fontSize: 28, lineHeight: 0.9, fontWeight: 700, color: c.forest }}>
                Elige tu aventura
              </span>
              <span className={s.pvTag} style={{ backgroundColor: c.terra }}>
                Senderismo
              </span>
              <span className={s.pvBox} style={{ backgroundColor: c.sand }} />
              <span className={s.pvBtn} style={{ backgroundColor: c.amber }}>
                Reservar
              </span>
            </div>
          </div>
          <button type="button" className="ad-btn ad-btn-plain" style={{ alignSelf: "flex-start" }} onClick={() => set("colors", { ...DEFAULT_COLORS })}>
            Volver a los colores originales
          </button>
        </section>

        <section className={`ad-card ${s.card}`}>
          <h2 className={s.h}>Redes sociales</h2>
          {SOCIAL.map((n) => (
            <div key={n.key}>
              <label className="ad-label" htmlFor={`aj-${n.key}`}>
                {n.label}
              </label>
              <div className={s.pre}>
                <span>
                  <BrandIcon name={n.brand} size={16} />
                  {n.prefix}
                </span>
                <input
                  id={`aj-${n.key}`}
                  placeholder={n.key === "facebook" ? "tupagina" : "tucuenta"}
                  value={toHandle(st.social[n.key], n.prefix)}
                  onChange={(e) => set("social", { ...st.social, [n.key]: toUrl(e.target.value, n.prefix) })}
                />
              </div>
            </div>
          ))}
          <div className={s.socRow}>
            <span>Mostrar íconos en el menú y el pie de página</span>
            <Switch on={st.showSocial} onChange={(v) => set("showSocial", v)} label="Mostrar redes" />
          </div>
        </section>

        <button type="button" className={`ad-btn ad-btn-amber ${s.saveAll}`} onClick={save} disabled={busy || !dirty}>
          <Icon name="check" />
          {busy ? "Guardando…" : "Guardar ajustes"}
        </button>
      </div>
    </div>
  );
}
