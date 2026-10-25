"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/context";
import Smooth from "@/lib/smoothScroll";
import type { CurrencyCode, Theme } from "@/lib/catalog";

const CURRENCIES: CurrencyCode[] = ["USD", "EGP", "AED", "SAR"];

function scrollToSec(id: string) {
  const el = document.getElementById(id);
  if (el) Smooth.scrollTo(window.scrollY + el.getBoundingClientRect().top);
}

export default function Nav() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);
  const theme = useApp((s) => s.theme);
  const currency = useApp((s) => s.currency);
  const menuOpen = useApp((s) => s.menuOpen);
  const count = useApp((s) => s.cart.reduce((n, it) => n + it.qty, 0));
  const setLang = useApp((s) => s.setLang);
  const setTheme = useApp((s) => s.setTheme);
  const setCurrency = useApp((s) => s.setCurrency);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const setMenuOpen = useApp((s) => s.setMenuOpen);
  const [hidden, setHidden] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setLifted(y > 40);
      setHidden(y > last && y > 420);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("lock", menuOpen);
    return () => document.body.classList.remove("lock");
  }, [menuOpen]);

  const links = [
    { id: "collection", label: t("nav.collection") },
    { id: "configurator", label: t("nav.configurator") },
    { id: "craft", label: t("nav.craft") },
    { id: "boutiques", label: t("nav.boutiques") },
  ];

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollToSec(id);
  };

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <>
      <nav className={`nav ${lifted ? "lifted" : ""} ${hidden ? "nav-hide" : ""}`} aria-label="Main">
        <div className="nav-inner">
          <a
            href="#hero"
            className="brand"
            aria-label={t("a11y.home")}
            onClick={(e) => go(e, "hero")}
          >
            <svg className="brand-mark" viewBox="0 0 72 44" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                <circle cx="16" cy="9" r="3" />
                <circle cx="36" cy="4" r="3" />
                <circle cx="56" cy="9" r="3" />
                <path d="M16 14 L12 32 H60 L56 14 L44 26 L36 12 L28 26 Z" />
                <path d="M14 39 H58" />
              </g>
            </svg>
            <span className="brand-name">AURELIA</span>
          </a>

          <div className="nav-links">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="nav-tools">
            <select
              className="t-btn t-cur"
              aria-label={t("a11y.currency")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              className="t-btn"
              aria-label={t("a11y.theme")}
              title={t("nav.theme")}
              onClick={() => setTheme(nextTheme)}
            >
              {nextTheme === "light" ? "☾" : "☀"}
            </button>
            <button
              className="t-btn"
              aria-label={lang === "en" ? "العربية" : "English"}
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
            >
              {lang === "en" ? "ع" : "EN"}
            </button>
            <button className="t-btn cart-btn" aria-label={t("a11y.cart")} onClick={() => setCartOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              <span className={`cart-count ${count > 0 ? "show" : ""}`}>{count}</span>
            </button>
            <button className="t-btn burger" aria-label={t("a11y.menu")} onClick={() => setMenuOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mm-top">
          <span className="brand-name">AURELIA</span>
          <button className="t-btn mm-close" aria-label="Close" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>
        <div className="mm-links">
          {links.map((l) => (
            <a key={l.id} href={`#${l.id}`} onClick={(e) => go(e, l.id)}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="mm-foot">
          <select value={currency} aria-label={t("a11y.currency")} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button onClick={() => setTheme(nextTheme)}>{nextTheme === "light" ? "☾ Theme" : "☀ Theme"}</button>
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
        </div>
      </div>
    </>
  );
}
