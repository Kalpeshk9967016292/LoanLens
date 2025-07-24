
"use client";

import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

type GoogleAdProps = {
    adSlot: string;
    adClient: string;
    className?: string;
    style?: React.CSSProperties;
};

export function GoogleAd({ adSlot, adClient, className, style = { display: 'block' } }: GoogleAdProps) {
    const insRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        if (!insRef.current || insRef.current.dataset.adStatus === 'filled') {
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("Ad push error:", err);
        }
    }, []);

    if (!adClient || !adSlot || adClient.startsWith("ca-pub-YOUR") || adSlot.startsWith("YOUR_AD")) {
        return (
             <div 
                className="w-full h-24 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed"
                data-ai-hint="advertisement banner"
            >
                <p className="text-muted-foreground">Advertisement Area</p>
            </div>
        )
    }

    return (
        <div className={className}>
            <ins
                ref={insRef}
                className="adsbygoogle"
                style={style}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}
