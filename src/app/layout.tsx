
"use client";

import { useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/lib/loan-utils';
import { GoogleAd } from '@/components/google-ad';

const AD_CLIENT = "ca-pub-YOUR_PUBLISHER_ID";
const AD_SLOT_TOP = "YOUR_AD_SLOT_ID_1";
const AD_SLOT_BOTTOM = "YOUR_AD_SLOT_ID_2";

// export const metadata: Metadata = {
//   title: 'I am Tiksha | LoanLens | Smart Loan & EMI Calculator',
//   description: 'Smart loan analysis and comparison tool. Calculate EMI, compare loans, analyze balance transfers, and see the impact of prepayments. Make informed financial decisions with LoanLens for home loans, personal loans, car loans, and more.',
//   keywords: [
//     'loan calculator', 
//     'emi calculator', 
//     'home loan emi calculator',
//     'personal loan emi calculator',
//     'car loan emi calculator',
//     'bike loan calculator',
//     'loan comparison', 
//     'interest rate', 
//     'amortization schedule', 
//     'loan prepayment', 
//     'balance transfer', 
//     'financial tools', 
//     'personal finance', 
//     'iamtiksha'
//   ],
//   openGraph: {
//     title: 'I am Tiksha | LoanLens | Smart Loan & EMI Calculator',
//     description: 'A smart financial tool to analyze and compare loans with ease.',
//     url: 'https://www.iamtiksha.com/lifetools/emi-calculator',
//     siteName: 'LoanLens',
//     images: [
//       {
//         url: 'https://www.iamtiksha.com/lifetools/emi-calculator/og-image.png',
//         width: 1200,
//         height: 630,
//       },
//     ],
//     locale: 'en_US',
//     type: 'website',
//   },
//   twitter: {
//     card: 'summary_large_image',
//     title: 'I am Tiksha | LoanLens | Smart Loan & EMI Calculator',
//     description: 'A smart financial tool to analyze and compare loans with ease.',
//     images: ['https://www.iamtiksha.com/lifetools/emi-calculator/twitter-image.png'],
//   },
// };

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currency, setCurrency] = useState(() => {
    const urlCurrency = searchParams.get('currency');
    if (urlCurrency && currencies.includes(urlCurrency)) return urlCurrency;
    return 'INR';
  });

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('currency', newCurrency);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Logo />
          <span className="font-headline text-xl font-semibold ml-3">
            LoanLens
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="w-32">
            <Suspense fallback={<div className="h-10 w-32 rounded-md bg-muted animate-pulse" />}>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Suspense>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>I am Tiksha | LoanLens | Smart Loan & EMI Calculator</title>
        <meta name="description" content="Smart loan analysis and comparison tool. Calculate EMI, compare loans, analyze balance transfers, and see the impact of prepayments. Make informed financial decisions with LoanLens for home loans, personal loans, car loans, and more." />
        <meta name="keywords" content="loan calculator, emi calculator, home loan emi calculator, personal loan emi calculator, car loan emi calculator, bike loan calculator, loan comparison, interest rate, amortization schedule, loan prepayment, balance transfer, financial tools, personal finance, iamtiksha" />
        <link rel="icon" href="https://www.iamtiksha.com/lifetools/emi-calculator/loanlenselogo.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <Script 
          id="adsbygoogle-script"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col'
        )}
      >
        <ThemeProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Header />
          </Suspense>

          <div className="container my-4">
            <GoogleAd adClient={AD_CLIENT} adSlot={AD_SLOT_TOP} />
          </div>

          <main className="flex-1">
              {children}
          </main>
          
          <div className="container my-4">
            <GoogleAd adClient={AD_CLIENT} adSlot={AD_SLOT_BOTTOM} />
          </div>

          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground">
                A smart financial tool built with AI.
              </p>
            </div>
          </footer>

          <Toaster />
        </ThemeProvider>
        
        <Script 
          id="gtag-manager"
          strategy="afterInteractive" 
          src="https://www.googletagmanager.com/gtag/js?id=UA-134232806-1" 
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'UA-134232806-1');
            `,
          }}
        />
      </body>
    </html>
  );
}
