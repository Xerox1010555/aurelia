"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/context";
import {
  BEZEL_SETS,
  BOUTIQUES,
  BRACELETS,
  DIALS,
  METALS,
  MODELS,
  modelById,
  type OptionGroupKey,
} from "@/lib/catalog";
import { configPrice, formatPrice } from "@/lib/pricing";
import Smooth from "@/lib/smoothScroll";
import MiniWatch from "@/components/MiniWatch";

/* ───────────────────────────── shared helpers ─────────────────────────── */

function scrollToSec(id: string) {
  const el = document.getElementById(id);
  if (el) Smooth.scrollTo(window.scrollY + el.getBoundingClientRect().top);
}

const FOCUS_SEC = "collection";

/* ───────────────────────────────────── hero ───────────────────────────── */

export function Hero() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);
  const model = modelById(useApp((s) => s.activeModel));
  const price = formatPrice(configPrice(model, useApp((s) => s.cfg)), useApp((s) => s.currency));

  return (
    <section id="hero" className="sec hero">
      <p className="eyebrow">{t("hero.eyebrow")}</p>
      <h1 id="heroTitle" className={lang === "ar" ? "ar-h1" : ""}>
        <span className="li">{t("hero.t1")}</span>
        <span className="li">{t("hero.t2")}</span>
        <span className="li em-gold">{t("hero.t3")}</span>
      </h1>
      <p className="hero-sub">{t("hero.sub")}</p>
      <div className="hero-cta">
        <button className="btn gold" data-magnetic="true" onClick={() => scrollToSec(FOCUS_SEC)}>
          {t("collection.eyebrow")}
        </button>
        <div className="hero-price chip-quiet">
          <span>
            {t("hero.from")} · <b id="heroMetaName">{model.name[lang]}</b>
          </span>
          <b id="heroMetaPrice">{price}</b>
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span className="mouse" />
        <span className="cue-t">{t("hero.scroll")}</span>
      </div>
    </section>
  );
}

/* ───────────────────────────────────── story ──────────────────────────── */

const STORY_ITEMS = [
  { num: "01", t: "story.c1t", b: "story.c1b", side: "l", pos: "p1" },
  { num: "02", t: "story.c2t", b: "story.c2b", side: "r", pos: "p2" },
  { num: "03", t: "story.c3t", b: "story.c3b", side: "l", pos: "p3" },
  { num: "04", t: "story.c4t", b: "story.c4b", side: "r", pos: "p4" },
] as const;

export function Story() {
  const { t } = useT();
  return (
    <section id="story" className="sec story">
      <div className="story-rail" aria-hidden="true">
        <i id="railDot" />
      </div>
      <div className="wrap">
        <p className="eyebrow rv">Aurelia · Anatomy</p>
        <h2 className="h2">
          <span className="li">{t("story.title")}</span>
        </h2>
      </div>
      {STORY_ITEMS.map((c) => (
        <div key={c.num} className={`callout ${c.side} ${c.pos}`}>
          <div className="c-line" aria-hidden="true" />
          <div className="c-num">{c.num}</div>
          <div className="c-box">
            <h3 className="c-t">{t(c.t)}</h3>
            <p className="c-b">{t(c.b)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ────────────────────────────────── collection ────────────────────────── */

export function Collection() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);
  const currency = useApp((s) => s.currency);
  const active = useApp((s) => s.activeModel);
  const selectModel = useApp((s) => s.selectModel);
  const addToCart = useApp((s) => s.addToCart);
  const showToast = useApp((s) => s.showToast);

  return (
    <section id="collection" className="sec">
      <div className="wrap">
        <p className="eyebrow rv">{t("collection.eyebrow")}</p>
        <h2 className="h2 rv" dangerouslySetInnerHTML={useT().tHtml("collection.heading")} />
        <p className="sub rv">{t("collection.sub")}</p>

        <div className="w-grid">
          {MODELS.map((m) => (
            <article key={m.id} className={`w-card ${active === m.id ? "active" : ""}`} data-model={m.id}>
              <button className="w-hit" aria-label={m.name[lang]} onClick={() => selectModel(m.id)} />
              <div className="w-mini">
                <MiniWatch p={m.mini} />
              </div>
              <div className="w-info">
                <h3>{m.name[lang]}</h3>
                <p>{m.tagline[lang]}</p>
                <div className="w-meta">
                  <span>
                    {t("cfg.ref")} {m.ref}
                  </span>
                  <span>{m.size}</span>
                  <span>{m.calibre}</span>
                </div>
              </div>
              <div className="w-price">
                {t("hero.from")} {formatPrice(m.basePrice, currency)}
              </div>
              <div className="w-actions">
                <button
                  className="btn ghost small"
                  onClick={() => {
                    selectModel(m.id);
                    scrollToSec("configurator");
                  }}
                >
                  {t("card.cta")}
                </button>
                <button
                  className="btn gold small"
                  onClick={() => {
                    addToCart(m.id, { dial: m.dial === "panda" ? "ivoire" : m.dial, bezel: BEZEL_SETS[m.bezel][0].id, metal: m.metal, bracelet: m.bracelet }, true);
                    showToast(t("toast.added"));
                  }}
                >
                  {t("card.add")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────── configurator ────────────────────────── */

export function Configurator() {
  const { t, tHtml, label } = useT();
  const lang = useApp((s) => s.lang);
  const currency = useApp((s) => s.currency);
  const activeModel = useApp((s) => s.activeModel);
  const cfg = useApp((s) => s.cfg);
  const cartCount = useApp((s) => s.cart.length);
  const setOption = useApp((s) => s.setOption);
  const addToCart = useApp((s) => s.addToCart);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const showToast = useApp((s) => s.showToast);
  const priceRef = useRef<HTMLElement>(null);

  const model = modelById(activeModel);
  const price = configPrice(model, cfg);
  const groupTitles: Record<OptionGroupKey, string> = {
    metal: t("cfg.metal"),
    dial: t("cfg.dial"),
    bezel: t("cfg.bezel"),
    bracelet: t("cfg.bracelet"),
  };

  const options: Record<OptionGroupKey, Array<{ id: string; name: string; hex?: string; duo?: [string, string] }>> = {
    metal: METALS.map((m) => ({ id: m.id, name: label("metals", m.id) })),
    dial: DIALS.filter((d) => !(model.subdials && ["black", "green", "blue"].includes(d.id))).map((d) => ({
      id: d.id,
      name: label("dials", d.id),
      hex: d.hex,
    })),
    bezel: (BEZEL_SETS[model.bezel] ?? []).map((b) => ({
      id: b.id,
      name: label("bezels", b.id),
      hex: b.ceramic,
      duo: b.a && b.b && b.a !== b.b ? [b.a, b.b] : undefined,
    })),
    bracelet: BRACELETS.map((b) => ({ id: b.id, name: label("bracelets", b.id) })),
  };

  /* animated price (legacy parity) */
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return;
    const o = { v: Number(el.dataset.v ?? price) };
    gsap.to(o, {
      v: price,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = formatPrice(o.v, currency);
      },
    });
    el.dataset.v = String(price);
  }, [price, currency]);

  return (
    <section id="configurator" className="sec">
      <div className="wrap">
        <p className="eyebrow rv">{t("cfg.eyebrow")}</p>
        <h2 className="h2 rv" dangerouslySetInnerHTML={tHtml("cfg.heading")} />
        <p className="sub rv">{model.tagline[lang]}</p>

        <div className="cfg-grid">
          <div className="cfg-stage rv">
            <div className="cfg-watch">
              <MiniWatch p={model.mini} />
            </div>
            <div className="cfg-stage-meta">
              <span className="cfg-ref">
                {t("cfg.ref")} {model.ref}
              </span>
              <span className="cfg-id">{model.name[lang]}</span>
            </div>
          </div>

          <div className="cfg-panel rv">
            {(Object.keys(groupTitles) as OptionGroupKey[]).map((group) => (
              <div className="cfg-row" key={group}>
                <div className="cfg-lbl">{groupTitles[group]}</div>
                <div className="chip-row" role="radiogroup" aria-label={groupTitles[group]}>
                  {options[group].map((o) => (
                    <button
                      key={o.id}
                      className={`chip ${cfg[group] === o.id ? "active" : ""}`}
                      onClick={() => setOption(group, o.id)}
                      aria-pressed={cfg[group] === o.id}
                    >
                      {o.duo ? (
                        <i className="chip-swatch duo" style={{ "--a": o.duo[0], "--b": o.duo[1] } as React.CSSProperties} />
                      ) : o.hex ? (
                        <i className="chip-swatch" style={{ background: o.hex }} />
                      ) : null}
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="cfg-total">
              <span>{t("cfg.total")}</span>
              <b ref={priceRef} data-v={price}>
                {formatPrice(price, currency)}
              </b>
            </div>
            <button
              className="btn gold wide"
              data-magnetic="true"
              onClick={() => {
                addToCart(model.id, cfg, true);
                showToast(t("toast.added"));
              }}
            >
              {t("cfg.add")}
            </button>
            {cartCount > 0 && (
              <button className="btn ghost wide" onClick={() => setCartOpen(true)}>
                {t("cart.title")} ({cartCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────── craft ──────────────────────────── */

const CRAFT_STATS: Array<{ to: number; suffix?: string; prefix?: string; lbl: string }> = [
  { to: 31, suffix: "", lbl: "craft.k1" },
  { to: 70, suffix: "h", lbl: "craft.k2" },
  { to: 2, prefix: "−2/+2 ", lbl: "craft.k3" },
  { to: 300, suffix: "m", lbl: "craft.k4" },
];

const CRAFT_ROWS = [
  { t: "craft.r1t", b: "craft.r1b" },
  { t: "craft.r2t", b: "craft.r2b" },
  { t: "craft.r3t", b: "craft.r3b" },
] as const;

export function Craft() {
  const { t, tHtml, label, isAr } = useT();
  const model = modelById(useApp((s) => s.activeModel));
  return (
    <section id="craft" className="sec">
      <div className="wrap">
        <p className="eyebrow rv">{t("craft.eyebrow")}</p>
        <h2 className="h2 rv" dangerouslySetInnerHTML={tHtml("craft.heading")} />

        <div className={`c-stats ${isAr ? "num-en" : ""}`}>
          {CRAFT_STATS.map((s) => (
            <div className="stat" key={s.lbl}>
              <div className="c-val" data-to={s.to}>
                {s.prefix}
                <span>0</span>
                {s.suffix}
              </div>
              <div className="c-lbl">{t(s.lbl)}</div>
            </div>
          ))}
        </div>

        <div className="craft-grid">
          <div className="craft-rows">
            {CRAFT_ROWS.map((r) => (
              <div className="c-row rv" key={r.t}>
                <h4>{t(r.t)}</h4>
                <p>{t(r.b)}</p>
              </div>
            ))}
          </div>
          <div className="craft-visual rv" aria-hidden="true">
            <div className="craft-dial">
              <MiniWatch p={model.mini} />
            </div>
            <div className="craft-ring" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────── testimonials ──────────────────────── */

const TESTIMONIALS = [
  { q: "testi.1q", a: "testi.1a", c: "testi.1c" },
  { q: "testi.2q", a: "testi.2a", c: "testi.2c" },
  { q: "testi.3q", a: "testi.3a", c: "testi.3c" },
] as const;

export function Testimonials() {
  const { t, tHtml } = useT();
  return (
    <section id="testimonials" className="sec">
      <div className="wrap">
        <p className="eyebrow rv">{t("testi.eyebrow")}</p>
        <h2 className="h2 rv" dangerouslySetInnerHTML={tHtml("testi.heading")} />
        <div className="t-grid">
          {TESTIMONIALS.map((x) => (
            <figure className="t-card rv" key={x.a}>
              <blockquote className="t-q">{t(x.q)}</blockquote>
              <figcaption>
                <b className="t-a">{t(x.a)}</b>
                <span className="t-c">{t(x.c)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────── boutiques ──────────────────────── */

export function Boutiques() {
  const { t, tHtml } = useT();
  const lang = useApp((s) => s.lang);
  const showToast = useApp((s) => s.showToast);
  return (
    <section id="boutiques" className="sec">
      <div className="wrap">
        <p className="eyebrow rv">{t("boutiques.eyebrow")}</p>
        <h2 className="h2 rv" dangerouslySetInnerHTML={tHtml("boutiques.heading")} />
        <p className="sub rv">{t("boutiques.sub")}</p>
        <div className="b-grid">
          {BOUTIQUES.map((b) => (
            <div className="b-card rv" key={b.id}>
              <h3 className="b-city">{b.city[lang]}</h3>
              <p className="b-addr">{b.addr}</p>
              <p className="b-hours">{b.hours}</p>
              <button className="btn line small" onClick={() => showToast(t("toast.appointment"))}>
                {t("boutiques.book")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────── newsletter ──────────────────────── */

export function Newsletter() {
  const { t } = useT();
  const showToast = useApp((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    const v = input?.value.trim() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      showToast(t("toast.errorEmail"));
      input?.focus();
      return;
    }
    try {
      const list: string[] = JSON.parse(localStorage.getItem("aurelia:subscribers") ?? "[]");
      if (Array.isArray(list) && !list.includes(v.toLowerCase())) list.push(v.toLowerCase());
      localStorage.setItem("aurelia:subscribers", JSON.stringify(list.slice(-200)));
    } catch {
      /* storage unavailable */
    }
    if (input) input.value = "";
    showToast(t("toast.subscribed"));
  };

  return (
    <section id="newsletter" className="sec">
      <div className="wrap">
        <div className="news-box glass rv">
          <p className="eyebrow">{t("news.eyebrow")}</p>
          <h3>{t("news.title")}</h3>
          <p className="news-sub">{t("news.sub")}</p>
          <form className="news-form" onSubmit={submit} noValidate>
            <input
              ref={inputRef}
              id="newsEmail"
              type="email"
              autoComplete="email"
              placeholder={t("news.placeholder")}
              aria-label={t("news.emailLabel")}
            />
            <button className="btn gold" data-magnetic="true" type="submit">
              {t("news.btn")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── footer ───────────────────────── */

export function Footer() {
  const { t } = useT();
  const lang = useApp((s) => s.lang);
  const boutiques = BOUTIQUES.slice(0, 3);
  return (
    <footer id="footer" className="sec footer">
      <div className="wrap">
        <div className="f-brand">
          <span className="brand-name">AURELIA</span>
          <p>{t("footer.tag")}</p>
        </div>
        <div className="f-col">
          <h4>{t("footer.col1")}</h4>
          {boutiques.map((b) => (
            <a key={b.id} href="#boutiques" onClick={(e) => { e.preventDefault(); scrollToSec("boutiques"); }}>
              {b.city[lang]}
            </a>
          ))}
        </div>
        <div className="f-col">
          <h4>{t("footer.col2")}</h4>
          <a href="#craft" onClick={(e) => { e.preventDefault(); scrollToSec("craft"); }}>{t("footer.s1")}</a>
          <a href="#configurator" onClick={(e) => { e.preventDefault(); scrollToSec("configurator"); }}>{t("footer.s2")}</a>
          <a href="#boutiques" onClick={(e) => { e.preventDefault(); scrollToSec("boutiques"); }}>{t("footer.s3")}</a>
        </div>
        <div className="f-col">
          <h4>{t("footer.col3")}</h4>
          <a href="#footer" onClick={(e) => e.preventDefault()}>{t("footer.l1")}</a>
          <a href="#footer" onClick={(e) => e.preventDefault()}>{t("footer.l2")}</a>
          <a href="#footer" onClick={(e) => e.preventDefault()}>{t("footer.l3")}</a>
        </div>
      </div>
      <div className="f-base">
        <p className="f-disc">{t("footer.disc")}</p>
        <p className="f-built">
          © {new Date().getFullYear()} AURELIA · {t("footer.built")}
        </p>
      </div>
    </footer>
  );
}
