"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n/context";
import { modelById } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import MiniWatch from "@/components/MiniWatch";

/* ───────────────────────────────── cart drawer ────────────────────────── */

export function CartDrawer() {
  const { t, label } = useT();
  const lang = useApp((s) => s.lang);
  const currency = useApp((s) => s.currency);
  const cart = useApp((s) => s.cart);
  const cartOpen = useApp((s) => s.cartOpen);
  const checkoutOpen = useApp((s) => s.checkoutOpen);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const setCheckoutOpen = useApp((s) => s.setCheckoutOpen);
  const changeQty = useApp((s) => s.changeQty);
  const removeFromCart = useApp((s) => s.removeFromCart);

  useEffect(() => {
    document.body.classList.toggle("lock", cartOpen || checkoutOpen);
    return () => document.body.classList.remove("lock");
  }, [cartOpen, checkoutOpen]);

  const total = cart.reduce((n, it) => n + it.unitPrice * it.qty, 0);

  return (
    <>
      <div
        className={`d-scrim ${cartOpen ? "show" : ""}`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <aside className={`drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen} aria-label={t("cart.title")}>
        <div className="d-head">
          <h3>{t("cart.title")}</h3>
          <button className="t-btn" onClick={() => setCartOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="d-body">
          {cart.length === 0 ? (
            <div className="d-empty">
              <p>{t("cart.empty")}</p>
              <button className="btn line" onClick={() => setCartOpen(false)}>
                {t("cart.emptyCta")}
              </button>
            </div>
          ) : (
            cart.map((it) => {
              const m = modelById(it.modelId);
              return (
                <div className="d-item" key={it.key}>
                  <div className="d-thumb">
                    <MiniWatch p={m.mini} live={false} />
                  </div>
                  <div className="d-info">
                    <b>{m.name[lang]}</b>
                    <span className="d-cfg">
                      {[
                        label("dials", it.cfg.dial),
                        label("bezels", it.cfg.bezel),
                        label("metals", it.cfg.metal),
                        label("bracelets", it.cfg.bracelet),
                      ].join(" · ")}
                    </span>
                    <span className="d-price">{formatPrice(it.unitPrice, currency)}</span>
                    <div className="d-qty">
                      <button onClick={() => changeQty(it.key, -1)} aria-label="−">
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button onClick={() => changeQty(it.key, 1)} aria-label="+">
                        +
                      </button>
                      <button
                        className="d-remove"
                        onClick={() => removeFromCart(it.key)}
                        aria-label={t("cart.remove")}
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div className="d-foot">
            <div className="d-total">
              <span>{t("cart.total")}</span>
              <b>{formatPrice(total, currency)}</b>
            </div>
            <p className="d-note">{t("cart.note")}</p>
            <button className="btn gold wide" onClick={() => setCheckoutOpen(true)}>
              {t("cart.checkout")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ───────────────────────────── simulated checkout ─────────────────────── */

export function CheckoutModal() {
  const { t, label } = useT();
  const lang = useApp((s) => s.lang);
  const currency = useApp((s) => s.currency);
  const cart = useApp((s) => s.cart);
  const checkoutOpen = useApp((s) => s.checkoutOpen);
  const setCheckoutOpen = useApp((s) => s.setCheckoutOpen);
  const setCartOpen = useApp((s) => s.setCartOpen);
  const clearCart = useApp((s) => s.clearCart);
  const [busy, setBusy] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", addr: "" });
  const [errs, setErrs] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const total = cart.reduce((n, it) => n + it.unitPrice * it.qty, 0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!checkoutOpen) {
    return (
      <div className="modal" aria-hidden="true">
        <div className="m-scrim" />
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const err = (k: string) => errs.includes(k);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bad: string[] = [];
    if (form.name.trim().length < 2) bad.push("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) bad.push("email");
    if (form.phone.trim().length < 4) bad.push("phone");
    if (form.city.trim().length < 2) bad.push("city");
    if (form.addr.trim().length < 2) bad.push("addr");
    setErrs(bad);
    if (bad.length) return;

    /* Simulated payment ledger — no card data exists anywhere in this flow */
    setBusy(true);
    timerRef.current = window.setTimeout(() => {
      setBusy(false);
      setOrderNo(`#AUR-${Math.floor(100000 + Math.random() * 900000)}`);
      clearCart();
    }, 900);
  };

  const close = () => {
    setCheckoutOpen(false);
    setOrderNo("");
    setErrs([]);
    setBusy(false);
  };

  const preview = cart[0] ? modelById(cart[0].modelId) : null;

  return (
    <div className="modal open" aria-hidden="false" role="dialog" aria-modal="true" aria-label={t("checkout.title")}>
      <div className="m-scrim" onClick={close} />
      <div className="m-box">
        <button className="t-btn m-close" onClick={close} aria-label="Close">
          ✕
        </button>
        {!orderNo ? (
          <div id="checkoutBody">
            <p className="eyebrow">{t("checkout.eyebrow")}</p>
            <h3 className="m-title">{t("checkout.title")}</h3>

            <div className="m-items">
              {cart.map((it) => {
                const m = modelById(it.modelId);
                return (
                  <div className="m-line" key={it.key}>
                    <b>{m.name[lang]}</b>
                    <span>
                      ×{it.qty} ·{" "}
                      {[
                        label("dials", it.cfg.dial),
                        label("bezels", it.cfg.bezel),
                        label("metals", it.cfg.metal),
                        label("bracelets", it.cfg.bracelet),
                      ].join(" · ")}
                    </span>
                    <em>{formatPrice(it.unitPrice * it.qty, currency)}</em>
                  </div>
                );
              })}
            </div>

            <form id="checkoutForm" className="f-grid" onSubmit={submit} noValidate>
              <div className="f-field">
                <label htmlFor="fName">{t("checkout.name")}</label>
                <input id="fName" type="text" autoComplete="name" value={form.name} onChange={set("name")} className={err("name") ? "err" : ""} required />
              </div>
              <div className="f-field">
                <label htmlFor="fEmail">{t("checkout.email")}</label>
                <input id="fEmail" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={err("email") ? "err" : ""} required />
              </div>
              <div className="f-field">
                <label htmlFor="fPhone">{t("checkout.phone")}</label>
                <input id="fPhone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={err("phone") ? "err" : ""} required />
              </div>
              <div className="f-field">
                <label htmlFor="fCity">{t("checkout.city")}</label>
                <input id="fCity" type="text" autoComplete="address-level2" value={form.city} onChange={set("city")} className={err("city") ? "err" : ""} required />
              </div>
              <div className="f-field f-full">
                <label htmlFor="fAddr">{t("checkout.addr")}</label>
                <input id="fAddr" type="text" autoComplete="street-address" value={form.addr} onChange={set("addr")} className={err("addr") ? "err" : ""} required />
              </div>

              <div className="f-field f-full f-pay" role="group" aria-labelledby="payLbl">
                <label id="payLbl">{t("checkout.payMethod")}</label>
                <div className="pay-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <path d="M3 10h18M6 15h4" />
                  </svg>
                  <div className="pay-card-t">
                    <b>DEMO CARD · •••• 4242</b>
                    <small>{t("checkout.payMock")}</small>
                  </div>
                  <span className="pay-badge">SIM</span>
                </div>
              </div>

              <p className="f-secure">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>{t("checkout.secure")}</span>
              </p>

              <div className="m-actions f-full">
                <div className="m-total">
                  <span>{t("cart.total")}</span>
                  <b>{formatPrice(total, currency)}</b>
                </div>
                <button className="btn gold" type="submit" disabled={busy} style={busy ? { opacity: 0.55 } : undefined}>
                  {busy ? t("checkout.simulating") : t("checkout.pay")}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div id="orderSuccess" role="status" aria-live="polite">
            <span className="s-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 12.5 10 18 20 6" />
              </svg>
            </span>
            <h3 className="s-title">{t("checkout.success")}</h3>
            <p className="s-sub">{t("checkout.successSub")}</p>
            <div className="s-order">
              <span>{t("checkout.order")}</span>
              <b>{orderNo}</b>
            </div>
            <button
              className="btn gold wide"
              onClick={() => {
                close();
                setCartOpen(false);
              }}
            >
              {t("checkout.continue")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────── toast ──────────────────────────── */

export function Toast() {
  const toast = useApp((s) => s.toast);
  const seq = useApp((s) => s.toastSeq);
  const [shown, setShown] = useState<{ msg: string; id: number } | null>(null);

  useEffect(() => {
    if (!toast || seq === 0) return;
    const item = { msg: toast, id: seq };
    setShown(item);
    const timer = window.setTimeout(() => {
      setShown((cur) => (cur && cur.id === item.id ? null : cur));
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [seq, toast]);

  return (
    <div id="toast" className={`toast ${shown ? "show" : ""}`} role="status" aria-live="polite">
      {shown?.msg ?? ""}
    </div>
  );
}
