"use client";

import { useId, useState, type ReactNode } from "react";
import type { L10n, Lang } from "@/lib/types";
import { Icon } from "../icons";
import s from "./fields.module.css";

export function LangTabs({ lang, onChange, label = "Idioma de los textos" }: { lang: Lang; onChange: (l: Lang) => void; label?: string }) {
  return (
    <div className={s.langRow}>
      <span className={s.langLabel}>{label}</span>
      <div className="ad-lang-tabs" role="group" aria-label={label}>
        {(["es", "en"] as const).map((l) => (
          <button key={l} type="button" className={lang === l ? "is-on" : ""} aria-pressed={lang === l} onClick={() => onChange(l)}>
            {l === "es" ? "Español" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Campo de texto bilingüe: edita el idioma activo y avisa si falta la traducción. */
export function L10nField({
  label,
  value,
  lang,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  help,
  error,
  max,
  required = false,
}: {
  label: ReactNode;
  value: L10n;
  lang: Lang;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  help?: ReactNode;
  error?: string;
  max?: number;
  required?: boolean;
}) {
  const id = useId();
  const current = value[lang] ?? "";
  const other = lang === "es" ? "en" : "es";
  const missing = !current && !!value[other];
  const props = {
    id,
    className: `ad-input ${error ? "is-bad" : ""}`,
    value: current,
    placeholder: placeholder ?? (lang === "en" && value.es ? value.es : undefined),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [lang]: e.target.value }),
  };
  return (
    <div>
      <label className="ad-label" htmlFor={id}>
        {label}
        {required && lang === "es" ? " *" : ""}
        <span className={s.meta}>
          {missing && <span className={s.missing}>Falta en {lang === "en" ? "inglés" : "español"}</span>}
          {max ? (
            <span className={current.length > max ? s.over : undefined}>
              {current.length} / {max}
            </span>
          ) : null}
          <span className={s.langTag}>{lang.toUpperCase()}</span>
        </span>
      </label>
      {multiline ? <textarea {...props} rows={rows} /> : <input {...props} />}
      {error ? (
        <span id={`${id}-err`} className="ad-err">
          <Icon name="info" />
          {error}
        </span>
      ) : (
        help && <p className="ad-help">{help}</p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  help,
  error,
  placeholder,
  inputMode,
  style,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  help?: ReactNode;
  error?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  style?: React.CSSProperties;
}) {
  const id = useId();
  return (
    <div>
      <label className="ad-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`ad-input ${error ? "is-bad" : ""}`}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        style={style}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <span id={`${id}-err`} className="ad-err">
          <Icon name="info" />
          {error}
        </span>
      ) : (
        help && <p className="ad-help">{help}</p>
      )}
    </div>
  );
}

export function MoneyField({ label, value, onChange, error }: { label: string; value: number; onChange: (v: number) => void; error?: string }) {
  const id = useId();
  return (
    <div>
      <label className="ad-label" htmlFor={id}>
        {label}
      </label>
      <div className={`ad-money ${error ? "is-bad" : ""}`} style={{ height: 50 }}>
        <span className="ad-money-s" style={{ fontSize: 26 }}>
          $
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step={10}
          inputMode="numeric"
          value={Number.isFinite(value) ? value : ""}
          style={{ fontSize: 26 }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        <span>MXN</span>
      </div>
      {error && (
        <span id={`${id}-err`} className="ad-err">
          <Icon name="info" />
          {error}
        </span>
      )}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={`ad-switch ${on ? "is-on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function SwitchRow({ title, help, on, onChange }: { title: string; help?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={s.switchRow}>
      <span className={s.switchTxt}>
        <strong>{title}</strong>
        {help && <span>{help}</span>}
      </span>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
}

export function FormCard({ n, title, aside, children }: { n?: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={`ad-card ${s.card}`}>
      <div className={s.cardHead}>
        <span className={s.cardTitle}>
          {n !== undefined && <span className={s.num}>{n}</span>}
          <h2>{title}</h2>
        </span>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Lista de textos cortos con chips (qué incluye, qué llevar, etiquetas). */
export function ChipList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  };
  return (
    <div className={s.chipBlock}>
      <label className="ad-label" htmlFor={id} style={{ margin: 0 }}>
        {label}
      </label>
      <div className={s.chips}>
        {items.map((it, i) => (
          <span key={`${it}-${i}`} className={s.chip}>
            {it}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Quitar ${it}`}>
              <Icon name="close" />
            </button>
          </span>
        ))}
        {!items.length && <span className={s.none}>Sin elementos todavía.</span>}
      </div>
      <div className={s.addRow}>
        <input
          id={id}
          className="ad-input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="ad-btn ad-btn-forest" onClick={add}>
          Agregar
        </button>
      </div>
    </div>
  );
}
