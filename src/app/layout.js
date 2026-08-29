import { Amiri, Cinzel, Cormorant_Garamond, Noto_Serif, Plus_Jakarta_Sans, Pinyon_Script, Italiana, Marcellus, Great_Vibes, Lora, Montserrat, Allura, Mrs_Saint_Delafield, Jost, Noto_Serif_Malayalam } from 'next/font/google';
import Script from 'next/script';
import AppProviders from './providers';
import './globals.css';

const malayalam = Noto_Serif_Malayalam({
  subsets: ['latin', 'malayalam'],
  weight: ['400', '600', '700'],
  variable: '--font-malayalam',
});

const mrsSaintDelafield = Mrs_Saint_Delafield({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mrs-saint',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
});

const allura = Allura({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-allura',
});

const amiri = Amiri({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const notoSerif = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const pinyonScript = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
});

const italiana = Italiana({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-italiana',
});

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-marcellus',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-vibes',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata = {
  metadataBase: new URL('https://www.webinvites.shop'),
  title: {
    default: 'Digital Wedding Invitations Online at ₹299 | WEB INVITES',
    template: '%s | WEB INVITES',
  },
  description: 'Create interactive digital wedding invitations in 5 mins. 25+ templates with Google Maps, RSVP & countdown at a flat ₹299. Share instantly on WhatsApp.',
  keywords: [
    'digital wedding invitation',
    'online wedding card maker',
    'WhatsApp wedding invitation link',
    'digital e-invite India',
    'wedding invitation website maker',
    'Nikah digital invitation',
    'Hindu wedding invitation online',
    'Christian wedding e-card',
    'Kerala wedding invitation web',
    'wedding countdown timer invite',
    'budget wedding website ₹299',
    'interactive wedding invitation mobile',
  ],
  authors: [{ name: 'Web Invites Team', url: 'https://www.webinvites.shop' }],
  creator: 'Web Invites',
  publisher: 'Web Invites',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Digital Wedding Invitations Online at ₹299 | WEB INVITES',
    description: 'Create interactive digital wedding invitations with Google Maps, RSVP, countdown & photo uploads at flat ₹299. Zero watermarks.',
    url: 'https://www.webinvites.shop',
    siteName: 'WEB INVITES',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/hero_layer.png',
        width: 1200,
        height: 630,
        alt: 'WEB INVITES — Digital Wedding Invitation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Wedding Invitations Online at ₹299 | WEB INVITES',
    description: 'Create interactive wedding websites in 5 mins. Live countdown, Google Maps navigation, RSVP, and WhatsApp sharing.',
    images: ['/hero_layer.png'],
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  verification: {
    google: 'du95bugt4x7NvgzDXhywFBKp7XYUAnRJV8a6-tBP0Zc',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoSerif.variable} ${cormorant.variable} ${cinzel.variable} ${amiri.variable} ${pinyonScript.variable} ${italiana.variable} ${marcellus.variable} ${greatVibes.variable} ${lora.variable} ${montserrat.variable} ${allura.variable} ${mrsSaintDelafield.variable} ${jost.variable} ${malayalam.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2435785479131903"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Analytics 4 (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BPNYZQ4PHZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BPNYZQ4PHZ', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
