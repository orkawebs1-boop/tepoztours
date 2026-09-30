"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon, type IconName } from "../icons";
import { LogoMark } from "../Logo";

/* ------------------------------------------------------------------ */
/* Contexto del panel                                                  */
/* ------------------------------------------------------------------ */

type ToastKind = "ok" | "err";
type Toast = { id: number; kind: ToastKind; title: string; text: string; retry?: () => void };
type ConfirmOpts = { title: string; text: string; confirmLabel?: string; danger?: boolean };
type PageHandlers = { dirty: boolean; save?: () => Promise<boolean> };

type AdminCtx = {
  toast: (kind: ToastKind, title: string, text: string, retry?: () => void) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  /** Cada pantalla registra si tiene cambios y cómo guardarlos. */
  setPage: (h: PageHandlers) => void;
  /** Vuelve a leer el estado de publicación (después de guardar). */
  refreshStatus: () => void;
  publish: () => Promise<void>;
  counts: { tours: number; pending: number };
  refreshCounts: () => void;
};

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin fuera del panel");
  return c;
}

/** Registra el estado de la pantalla actual para Guardar/Publicar. */
export function usePageSave(dirty: boolean, save: () => Promise<boolean>) {
  const { setPage } = useAdmin();
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    setPage({ dirty, save: () => saveRef.current() });
  }, [dirty, setPage]);
  useEffect(() => () => setPage({ dirty: false }), [setPage]);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */

const NAV: { group: string; items: { href: string; label: string; icon: IconName; count?: "tours" | "pending" }[] }[] = [
  {
    group: "General",
    items: [
      { href: "/admin", label: "Resumen", icon: "grid" },
      { href: "/admin/editor", label: "Editor del sitio", icon: "desktop" },
    ],
  },
  {
    group: "Contenido",
    items: [
      { href: "/admin/hero", label: "Hero / carrusel", icon: "layers" },
      { href: "/admin/tours", label: "Tours", icon: "mountain", count: "tours" },
      { href: "/admin/precios", label: "Precios", icon: "tag" },
      { href: "/admin/contenido", label: "Galería y equipo", icon: "image" },
    ],
  },
  {
    group: "Operación",
    items: [
      { href: "/admin/reservas", label: "Reservas", icon: "calendar", count: "pending" },
      { href: "/admin/ajustes", label: "Ajustes", icon: "settings" },
    ],
  },
];

function titleFor(path: string): { crumb: string; title: string } {
  if (path === "/admin") return { crumb: "Panel · General", title: "Resumen" };
  if (path.startsWith("/admin/editor")) return { crumb: "Panel · General", title: "Editor del sitio" };
  if (path.startsWith("/admin/hero")) return { crumb: "Panel · Contenido", title: "Hero / carrusel" };
  if (path === "/admin/tours/nuevo") return { crumb: "Panel · Contenido · Tours", title: "Nuevo tour" };
  if (path.startsWith("/admin/tours/")) return { crumb: "Panel · Contenido · Tours", title: "Editar tour" };
  if (path.startsWith("/admin/tours")) return { crumb: "Panel · Contenido", title: "Tours" };
  if (path.startsWith("/admin/precios")) return { crumb: "Panel · Contenido", title: "Precios rápidos" };
  if (path.startsWith("/admin/contenido")) return { crumb: "Panel · Contenido", title: "Galería y equipo" };
  if (path.startsWith("/admin/reservas")) return { crumb: "Panel · Operación", title: "Reservas" };
  if (path.startsWith("/admin/ajustes")) return { crumb: "Panel · Operación", title: "Ajustes" };
  return { crumb: "Panel", title: "" };
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function AdminShell({
  email,
  initialCounts,
  initialStatus,
  children,
}: {
  email: string;
  initialCounts: { tours: number; pending: number };
  initialStatus: { draftChangedAt: string | null; publishedAt: string | null };
  children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const [page, setPageState] = useState<PageHandlers>({ dirty: false });
  const [status, setStatus] = useState(initialStatus);
  const [counts, setCounts] = useState(initialCounts);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  const toastId = useRef(0);

  // «Recordarme» desactivado: si es una sesión nueva del navegador, se cierra la sesión.
  useEffect(() => {
    try {
      if (localStorage.getItem("tt-session-only") && !sessionStorage.getItem("tt-alive")) {
        supabaseBrowser()
          .auth.signOut()
          .then(() => router.replace("/admin/login"));
      }
      sessionStorage.setItem("tt-alive", "1");
    } catch {}
  }, [router]);

  const toast = useCallback<AdminCtx["toast"]>((kind, title, text, retry) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-2), { id, kind, title, text, retry }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "err" ? 6000 : 3400);
  }, []);

  const confirm = useCallback<AdminCtx["confirm"]>(
    (opts) => new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })),
    [],
  );

  const setPage = useCallback((h: PageHandlers) => setPageState(h), []);

  const refreshStatus = useCallback(async () => {
    const sb = supabaseBrowser();
    const [st, snap] = await Promise.all([
      sb.from("site_state").select("draft_changed_at").eq("id", 1).maybeSingle(),
      sb.from("site_snapshots").select("published_at").order("published_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setStatus({
      draftChangedAt: (st.data?.draft_changed_at as string) ?? null,
      publishedAt: (snap.data?.published_at as string) ?? null,
    });
  }, []);

  const refreshCounts = useCallback(async () => {
    const sb = supabaseBrowser();
    const [t, r] = await Promise.all([
      sb.from("tours").select("id", { count: "exact", head: true }),
      sb.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    ]);
    setCounts({ tours: t.count ?? 0, pending: r.count ?? 0 });
  }, []);

  const runSave = useCallback(async (): Promise<boolean> => {
    const p = pageRef.current;
    if (!p.dirty || !p.save) return true;
    const ok = await p.save();
    if (ok) await refreshStatus();
    return ok;
  }, [refreshStatus]);

  const save = async () => {
    if (!page.dirty || !page.save) {
      toast("ok", "Todo está guardado", "No hay cambios pendientes en esta pantalla.");
      return;
    }
    setBusy("save");
    const ok = await runSave();
    setBusy(null);
    if (ok) toast("ok", "Cambios guardados", "Aún no se ven en el sitio. Toca Publicar cuando estés listo.");
  };

  const publish = useCallback(async function publishSite(): Promise<void> {
    setBusy("publish");
    const saved = await runSave();
    if (!saved) {
      setBusy(null);
      return;
    }
    const { error } = await supabaseBrowser().rpc("publish_site");
    setBusy(null);
    if (error) {
      toast("err", "No se pudo publicar", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen guardados.", () => publishSite());
      return;
    }
    await refreshStatus();
    toast("ok", "Sitio publicado", "Tus cambios ya están en línea.");
  }, [runSave, refreshStatus, toast]);

  const logout = async () => {
    if (page.dirty && !(await confirm({ title: "¿Salir sin guardar?", text: "Tienes cambios sin guardar en esta pantalla. Si sales ahora se perderán.", confirmLabel: "Salir", danger: false }))) return;
    await supabaseBrowser().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  // Aviso al navegar dentro del panel con cambios sin guardar.
  const onNav = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMenuOpen(false);
    if (!page.dirty || href === path) return;
    e.preventDefault();
    const ok = await confirm({
      title: "¿Salir sin guardar?",
      text: "Tienes cambios sin guardar en esta pantalla. Guárdalos o se perderán al salir.",
      confirmLabel: "Salir sin guardar",
      danger: false,
    });
    if (ok) {
      setPageState({ dirty: false });
      router.push(href);
    }
  };

  const statusView = page.dirty
    ? { cls: "is-dirty", txt: "Cambios sin guardar" }
    : status.publishedAt && status.draftChangedAt && new Date(status.draftChangedAt) > new Date(status.publishedAt)
      ? { cls: "", txt: "Guardado · sin publicar" }
      : { cls: "is-pub", txt: "Publicado" };

  const { crumb, title } = titleFor(path);
  const ctx = useMemo<AdminCtx>(
    () => ({ toast, confirm, setPage, refreshStatus, publish, counts, refreshCounts }),
    [toast, confirm, setPage, refreshStatus, publish, counts, refreshCounts],
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className={`ad-shell ${menuOpen ? "menu-open" : ""}`}>
        <aside className="ad-side" aria-label="Panel">
          <Link href="/admin" className="ad-brand" aria-label="TepozTours, panel" onClick={(e) => onNav(e, "/admin")}>
            <LogoMark size={40} />
            <span>
              <span className="tt-d" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, letterSpacing: ".03em" }}>
                Tepoz<span style={{ color: "var(--amber)" }}>tours</span>
              </span>
              <small>Administración</small>
            </span>
          </Link>
          <nav aria-label="Secciones del panel" style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
            {NAV.map((g) => (
              <div key={g.group} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="ad-nav-h">{g.group}</span>
                {g.items.map((it) => {
                  const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
                  const n = it.count ? counts[it.count] : 0;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`ad-nav ${on ? "is-on" : ""}`}
                      aria-current={on ? "page" : undefined}
                      onClick={(e) => onNav(e, it.href)}
                    >
                      <Icon name={it.icon} />
                      {it.label}
                      {it.count && n > 0 && <span className="ad-nav-n">{n}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="ad-user">
            <span className="ad-avatar">{email.slice(0, 2).toUpperCase()}</span>
            <span className="ad-user-txt">
              <strong>Administrador</strong>
              <span title={email}>{email}</span>
            </span>
            <button type="button" className="ad-logout" onClick={logout} aria-label="Cerrar sesión">
              <Icon name="logout" />
            </button>
          </div>
        </aside>
        <div className="ad-scrim" onClick={() => setMenuOpen(false)} />

        <div>
          <header className="ad-top">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" className="ad-ibtn ad-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú del panel">
                <Icon name="menu" />
              </button>
              <div>
                <div className="ad-crumb">{crumb}</div>
                <h1 className="tt-d ad-title">{title}</h1>
              </div>
            </div>
            <div className="ad-top-actions">
              <span className={`ad-status ${statusView.cls}`} role="status">
                <span className="ad-status-dot" />
                {statusView.txt}
              </span>
              <a className="ad-btn ad-btn-plain ad-hide-sm" href="/es" target="_blank" rel="noopener">
                <Icon name="external" />
                Ver sitio
              </a>
              <button type="button" className="ad-btn ad-btn-ghost" onClick={save} disabled={busy !== null}>
                <Icon name="check" />
                {busy === "save" ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className="ad-btn ad-btn-amber" onClick={publish} disabled={busy !== null}>
                <Icon name="upload" />
                {busy === "publish" ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </header>
          <main className="ad-main">{children}</main>
        </div>
      </div>

      <div className="ad-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ad-toast ${t.kind === "ok" ? "is-ok" : "is-err"}`} role={t.kind === "err" ? "alert" : "status"}>
            <span className="ad-toast-ico">
              <Icon name={t.kind === "ok" ? "check" : "alert"} />
            </span>
            <span style={{ flexGrow: 1 }}>
              <span className="ad-toast-t">{t.title}</span>
              <span className="ad-toast-s">{t.text}</span>
              {t.retry && (
                <button
                  type="button"
                  className="ad-btn ad-btn-plain ad-toast-retry"
                  onClick={() => {
                    setToasts((list) => list.filter((x) => x.id !== t.id));
                    t.retry?.();
                  }}
                >
                  Reintentar
                </button>
              )}
            </span>
            <button type="button" className="ad-toast-x" aria-label="Cerrar aviso" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}>
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>

      {dialog && (
        <ConfirmDialog
          {...dialog}
          onClose={(v) => {
            dialog.resolve(v);
            setDialog(null);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

function ConfirmDialog({
  title,
  text,
  confirmLabel = "Sí, eliminar",
  danger = true,
  onClose,
}: ConfirmOpts & { onClose: (v: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="ad-overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="ad-modal" role="alertdialog" aria-modal="true" aria-labelledby="ad-dlg-t" aria-describedby="ad-dlg-d">
        <span className="ad-modal-ico" style={danger ? undefined : { background: "var(--warn-bg)", color: "var(--warn-fg)" }}>
          <Icon name={danger ? "trash" : "alert"} />
        </span>
        <h3 id="ad-dlg-t">{title}</h3>
        <p id="ad-dlg-d">{text}</p>
        <div className="ad-modal-actions">
          <button ref={cancelRef} type="button" className="ad-btn ad-btn-plain" onClick={() => onClose(false)}>
            Cancelar
          </button>
          <button type="button" className={`ad-btn ${danger ? "ad-btn-danger" : "ad-btn-forest"}`} onClick={() => onClose(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
