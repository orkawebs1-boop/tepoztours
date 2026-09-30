"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditKind } from "@/lib/edit";
import type { Lang } from "@/lib/types";
import { Icon } from "../icons";

/**
 * Capa del editor visual dentro del iframe de vista previa.
 * Muestra un botón negro sobre cada elemento marcado con data-edit, avisa al
 * panel qué se quiere editar y aplica en vivo los cambios que el panel envía.
 */

type Spot = { target: string; kind: EditKind; top: number; left: number; width: number; height: number };

export type EditorMessage =
  | { source: "tt-panel"; type: "patch"; target: string; kind: EditKind; part?: string; value: string }
  | { source: "tt-panel"; type: "select"; target: string | null };

const LABEL: Record<EditKind, string> = { text: "Editar texto", image: "Cambiar imagen", price: "Editar precio" };
const ICON: Record<EditKind, "edit" | "image" | "tag"> = { text: "edit", image: "image", price: "tag" };

export function EditOverlay({ lang }: { lang: Lang }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const frame = useRef(0);

  const scan = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const seen = new Set<string>();
      const list: Spot[] = [];
      document.querySelectorAll<HTMLElement>("[data-edit]").forEach((el) => {
        const target = el.dataset.edit!;
        const kind = (el.dataset.editKind as EditKind) ?? "text";
        const key = `${target}|${kind}`;
        const r = el.getBoundingClientRect();
        if (seen.has(key) || r.width < 8 || r.height < 8) return;
        // Elementos ocultos (por ejemplo, textos solo de móvil en escritorio)
        if (getComputedStyle(el).display === "none" || el.closest("[aria-hidden='true']")) return;
        seen.add(key);
        list.push({ target, kind, top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
      });
      setSpots(list);
    });
  }, []);

  useEffect(() => {
    scan();
    const ro = new ResizeObserver(scan);
    ro.observe(document.body);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.addEventListener("resize", scan);
    const t = setInterval(scan, 1500);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", scan);
      clearInterval(t);
    };
  }, [scan]);

  // En el editor no se navega fuera de la página.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("#") || a.closest("[data-tt-overlay]")) return;
      e.preventDefault();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Cambios en vivo enviados por el panel.
  useEffect(() => {
    const onMessage = (e: MessageEvent<EditorMessage>) => {
      if (e.origin !== window.location.origin || e.data?.source !== "tt-panel") return;
      const msg = e.data;
      if (msg.type === "select") {
        setSelected(msg.target);
        if (msg.target) {
          const el = document.querySelector<HTMLElement>(`[data-edit="${CSS.escape(msg.target)}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      applyPatch(msg.target, msg.kind, msg.part, msg.value);
      scan();
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ source: "tt-preview", type: "ready", lang }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [lang, scan]);

  const pick = (s: Spot) => {
    setSelected(s.target);
    window.parent.postMessage({ source: "tt-preview", type: "edit", target: s.target, kind: s.kind, lang }, window.location.origin);
  };

  return (
    <div data-tt-overlay style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, zIndex: 1000 }}>
      {spots.map((s) => {
        const on = selected === s.target;
        return (
          <div key={`${s.target}|${s.kind}`}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: s.top - 3,
                left: s.left - 3,
                width: s.width + 6,
                height: s.height + 6,
                border: `2px dashed ${on ? "#E9A23B" : "rgba(233,162,59,.55)"}`,
                borderRadius: 10,
                pointerEvents: "none",
                background: on ? "rgba(233,162,59,.08)" : "transparent",
              }}
            />
            <button
              type="button"
              className="ad-edit"
              onClick={() => pick(s)}
              style={{
                position: "absolute",
                top: Math.max(4, s.top + (s.kind === "image" ? (s.height > 500 ? 112 : 12) : -14)),
                left: s.kind === "image" ? s.left + s.width - 150 : s.left + Math.max(0, s.width - 140),
                ...(on ? { background: "#E9A23B", color: "#1C1A15" } : null),
              }}
            >
              <Icon name={ICON[s.kind]} />
              {LABEL[s.kind]}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Aplica un cambio en el DOM de la vista previa (sin recargar). */
function applyPatch(target: string, kind: EditKind, part: string | undefined, value: string) {
  if (part) {
    document.querySelectorAll<HTMLElement>(`[data-part-of="${CSS.escape(target)}"][data-part="${CSS.escape(part)}"]`).forEach((el) => {
      el.textContent = value;
    });
    return;
  }
  document.querySelectorAll<HTMLElement>(`[data-edit="${CSS.escape(target)}"][data-edit-kind="${kind}"]`).forEach((el) => {
    if (kind === "image") {
      let img = el.querySelector<HTMLImageElement>(":scope > img");
      if (!img) {
        img = document.createElement("img");
        img.className = el.querySelector("img")?.className || "tt-img";
        img.alt = "";
        img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover";
        el.prepend(img);
      }
      img.src = value;
      el.querySelectorAll(".tt-photo-chip").forEach((c) => c.remove());
      return;
    }
    const link = el.querySelector("a");
    const leaf = link && el.children.length === 1 ? link : el;
    leaf.innerText = value;
  });
}
