"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase/client";
import s from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setBusy(false);
      setError(
        err.message.toLowerCase().includes("invalid")
          ? "El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo."
          : "No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.",
      );
      return;
    }
    // «Recordarme» desactivado: la sesión se cierra al cerrar el navegador.
    try {
      if (remember) localStorage.removeItem("tt-session-only");
      else localStorage.setItem("tt-session-only", "1");
      sessionStorage.setItem("tt-alive", "1");
    } catch {}
    router.replace("/admin");
    router.refresh();
  };

  const forgot = async () => {
    setError("");
    if (!email.trim()) {
      setError("Escribe tu correo arriba y vuelve a tocar «¿Olvidaste tu contraseña?».");
      return;
    }
    const { error: err } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/recuperar`,
    });
    if (err) setError("No pudimos enviar el correo. Inténtalo en unos minutos.");
    else setNotice("Te enviamos un correo con un enlace para crear una nueva contraseña.");
  };

  return (
    <div className={s.page}>
      <div className={`tt-ph ${s.art}`}>
        <div className={s.brand}>
          <LogoMark size={48} hill="#F6EFE3" />
          <span className="tt-d">
            Tepoz<span style={{ color: "var(--amber)" }}>tours</span>
          </span>
        </div>
        <svg viewBox="0 0 600 260" className={s.hills} aria-hidden="true">
          <circle cx="384" cy="96" r="70" fill="#E9A23B" />
          <path d="M0 260L90 150L130 186L200 70L246 132L282 104L352 178L420 150L500 214L600 180V260Z" fill="#2C5040" />
          <path d="M186 74h28v-8h-5v-8h-18v8h-5z" fill="#2C5040" />
          <path d="M0 260L70 210L140 236L230 180L320 226L420 196L520 232L600 212V260Z" fill="#14261E" />
        </svg>
        <div className={s.pitch}>
          <span className={s.kicker}>Panel privado</span>
          <h2 className="tt-d">
            Administra
            <br />
            tu sitio
          </h2>
          <p>Cambia fotos, textos y precios, agrega tours y lleva el registro de tus reservas desde un solo lugar.</p>
        </div>
      </div>

      <div className={s.formCol}>
        <Link href="/es" className={s.siteLink}>
          <Icon name="external" size={17} />
          Ver sitio público
        </Link>
        <form className={s.form} onSubmit={submit} noValidate>
          <div className={s.head}>
            <h1 className="tt-d">Bienvenido</h1>
            <p>Entra con tu cuenta de administrador.</p>
          </div>
          <div>
            <label className="ad-label" htmlFor="login-mail">
              Correo electrónico
            </label>
            <div className={s.field}>
              <Icon name="mail" />
              <input
                id="login-mail"
                type="email"
                placeholder="admin@tudominio.mx"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="ad-label" htmlFor="login-pass">
              Contraseña
            </label>
            <div className={s.field}>
              <Icon name="lock" />
              <input
                id="login-pass"
                type={show ? "text" : "password"}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={s.eye}
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <Icon name={show ? "eyeOff" : "eye"} />
              </button>
            </div>
          </div>
          <div className={s.row}>
            <label className={s.remember}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Recordarme
            </label>
            <button type="button" className={s.forgot} onClick={forgot}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          {error && (
            <p className={s.error} role="alert">
              <Icon name="alert" size={16} />
              {error}
            </p>
          )}
          {notice && (
            <p className={s.notice} role="status">
              <Icon name="check" size={16} />
              {notice}
            </p>
          )}
          <button type="submit" className={s.submit} disabled={busy}>
            {busy ? "Entrando…" : "Entrar al panel"}
            <Icon name="arrowRight" />
          </button>
          <p className={s.only}>
            <Icon name="lock" size={16} />
            Acceso solo para el equipo de TepozTours.
          </p>
        </form>
      </div>
    </div>
  );
}
