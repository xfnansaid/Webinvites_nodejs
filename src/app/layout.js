import { Amiri, Cinzel, Cormorant_Garamond, Noto_Serif, Plus_Jakarta_Sans, Pinyon_Script, Italiana, Marcellus, Great_Vibes, Lora, Montserrat, Allura, Mrs_Saint_Delafield, Jost, Noto_Serif_Malayalam } from 'next/font/google';

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
import './globals.css';

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
  title: 'WEB INVITES — Digital Wedding & Event Invitations | ₹399 Flat | Share on WhatsApp',
  description: 'Create beautiful digital wedding and event invitations in minutes. 10 premium templates, flat ₹399, Canva-style inline WYSIWYG editor, live countdown, Get Directions link & WhatsApp sharing.',
  keywords: 'digital wedding invitation, online wedding invitation, WhatsApp wedding card, digital e-invite India, wedding invitation maker, Nikah invitation online, engagement invitation digital, WYSIWYG invite editor, countdown wedding invite, Get Directions link',
  openGraph: {
    title: 'WEB INVITES — ₹399 Flat • Digital Wedding & Event Invitations',
    description: '10 premium templates at one flat ₹399. Canva-style inline editor, live countdown, Get Directions & WhatsApp sharing. Preview with watermark, then publish.',
    type: 'website',
    url: 'https://webinvites.shop',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'WEB INVITES',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoSerif.variable} ${cormorant.variable} ${cinzel.variable} ${amiri.variable} ${pinyonScript.variable} ${italiana.variable} ${marcellus.variable} ${greatVibes.variable} ${lora.variable} ${montserrat.variable} ${allura.variable} ${mrsSaintDelafield.variable} ${jost.variable} ${malayalam.variable} scroll-smooth`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
