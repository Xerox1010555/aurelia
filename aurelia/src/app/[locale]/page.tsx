import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Lang } from "@/lib/catalog";
import PrefsSync from "@/components/PrefsSync";
import WatchStage from "@/components/WatchStage";
import Nav from "@/components/Nav";
import Cursor from "@/components/Cursor";
import { CartDrawer, CheckoutModal, Toast } from "@/components/overlays";
import {
  Hero,
  Story,
  Collection,
  Configurator,
  Craft,
  Testimonials,
  Boutiques,
  Newsletter,
  Footer,
} from "@/components/sections";
import { LangProvider } from "@/lib/i18n/context";

const LOCALES: Lang[] = ["en", "ar"];

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === "ar";
  return {
    title: ar
      ? "أوريليا — بوتيك معتمد · صيحة الوقت الفاخر بالثلاثية"
      : "AURELIA — Authorized Boutique · Haute Horlogerie in 3D",
    description: ar
      ? "أربع نسخ أسطورية تُبنى برمجيًا وتُعرض بالثلاثية الأبعاد لحظيًا. كوّن ساعتك الآن."
      : "Four legendary references, procedurally built and rendered in real-time 3D. Configure yours live.",
  };
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();

  return (
    <LangProvider locale={locale}>
      <PrefsSync locale={locale} />
      <WatchStage />
      <Nav />
      <main id="page">
        <Hero />
        <Story />
        <Collection />
        <Configurator />
        <Craft />
        <Testimonials />
        <Boutiques />
        <Newsletter />
        <Footer />
      </main>
      <CartDrawer />
      <CheckoutModal />
      <Toast />
      <Cursor />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: "AURELIA",
            description: "Independent concept haute horlogerie boutique — four legendary references rendered in real-time 3D.",
            slogan: "Time is the ultimate luxury.",
            currenciesAccepted: "USD, EGP, AED, SAR",
            address: { "@type": "PostalAddress", addressLocality: "Geneva", addressCountry: "CH" },
            openingHours: "Mo-Sa 10:00-19:00",
          }),
        }}
      />
    </LangProvider>
  );
}
