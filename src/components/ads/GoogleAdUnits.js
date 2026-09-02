'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

/**
 * InFeedAdBanner
 *
 * Renders a responsive native in-feed Google AdSense / Ad Manager banner.
 * Styled cleanly with subtle borders and clear "Sponsored / Advertisement" labeling
 * to conform with Google AdSense quality and placement guidelines.
 */
export function InFeedAdBanner({ adSlotId, adClient }) {
  const adRef = useRef(null);
  const client = adClient || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = adSlotId || process.env.NEXT_PUBLIC_ADSENSE_INFEED_SLOT || '9246211840';

  useEffect(() => {
    if (typeof window !== 'undefined' && client) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ignore adsbygoogle push warnings if ad blocker or pending
      }
    }
  }, [client]);

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client || 'ca-pub-2435785479131903'}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <div className="w-full my-8 px-4 flex flex-col items-center justify-center print:hidden">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 sm:p-4 text-center shadow-xs overflow-hidden">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Advertisement
        </div>
        
        {client ? (
          <ins
            className="adsbygoogle block min-h-[90px] w-full"
            style={{ display: 'block' }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          /* Subtle Sponsor Placeholder when client ID is not yet configured */
          <div className="flex flex-col items-center justify-center py-6 px-4 text-stone-400">
            <span className="text-xs font-medium">Google Ad Placement</span>
            <span className="text-[10px] text-stone-400 mt-0.5">
              Set NEXT_PUBLIC_ADSENSE_CLIENT_ID to serve live ads
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

/**
 * StickyAnchorAd
 *
 * Renders a responsive mobile sticky anchor ad unit.
 */
export function StickyAnchorAd({ adSlotId, adClient }) {
  const client = adClient || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = adSlotId || process.env.NEXT_PUBLIC_ADSENSE_ANCHOR_SLOT;

  useEffect(() => {
    if (typeof window !== 'undefined' && client && slot) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Ignore
      }
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white/90 backdrop-blur-sm border-t border-stone-200 p-1 flex justify-center print:hidden">
      <ins
        className="adsbygoogle block"
        style={{ display: 'inline-block', width: '320px', height: '50px' }}
        data-ad-client={client}
        data-ad-slot={slot}
      />
    </div>
  );
}
