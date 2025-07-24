
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

function SeoContent() {
    return (
        <section className="container py-12">
            <div className="prose dark:prose-invert max-w-full">
                <h2 className="text-2xl font-bold mb-4 font-headline">Master Your Loans with LoanLens</h2>
                <p>Welcome to LoanLens, your all-in-one financial toolkit designed to bring clarity to your loan and EMI management. Whether you're planning for a new home, a car, or want to optimize your existing debts, our suite of calculators provides the insights you need to make smart financial decisions.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Comprehensive EMI Calculator</h3>
                <p>Our primary <a href="/?tab=emi-calculator">EMI Calculator</a> is a powerful tool for prospective borrowers. By simply entering the loan amount, interest rate, and tenure, you can instantly see your Equated Monthly Installment (EMI). This feature is essential for budgeting and understanding the financial commitment of a new loan. It also provides a complete amortization schedule, breaking down how much of each payment goes towards principal versus interest over the entire loan term.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Side-by-Side Loan Comparison</h3>
                <p>Making the right choice between multiple loan offers can be daunting. Our <a href="/?tab=loan-comparison">Loan Comparison</a> tool simplifies this process. You can compare up to three different loan scenarios side-by-side, visualizing the differences in EMI, total interest paid, and total cost. This is invaluable when comparing offers for home loans, personal loans, or car loans from different banks with varying interest rates and tenures.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Smart Balance Transfer Analysis</h3>
                <p>A balance transfer can be a strategic move to reduce your interest burden. Our <a href="/?tab=balance-transfer">Balance Transfer Calculator</a> helps you determine if moving your outstanding loan amount to a new lender with a lower interest rate is a good financial decision. It accounts for processing fees and clearly shows your potential savings in both total payment and monthly EMI, empowering you to make an informed choice.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Prepayment Impact Calculator</h3>
                <p>Paying more than your required EMI can significantly reduce your loan tenure and the total interest you pay. The <a href="/?tab=prepayment-impact">Prepayment Impact Calculator</a> demonstrates the power of making extra payments. See exactly how much interest you can save and how many months or years you can shave off your loan term by adding a small extra amount to your monthly payments. This tool is perfect for planning your path to becoming debt-free sooner.</p>

                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Debt Consolidation Strategy</h3>
                <p>If you're juggling multiple loans—such as credit card debt, a personal loan, and a car loan—managing them can be overwhelming. Debt consolidation is a financial strategy where you take out a new, single loan to pay off all your other outstanding debts. Typically, this new loan has a lower interest rate than the combined rates of your previous debts. Our tools can help you analyze if a new consolidation loan is the right move. Use the Loan Comparison tool to compare a new consolidation loan offer against your existing combined payments to see potential savings and simplify your monthly finances.</p>
                
                <h3 className="text-xl font-semibold mt-6 mb-2 font-headline">Your Partner in Financial Planning</h3>
                <p>LoanLens is more than just a calculator; it's a partner in your financial journey. By providing clear, accurate, and instant calculations, we help you understand the long-term impact of your financial decisions. Whether you are a first-time borrower or a seasoned investor, our tools provide the clarity needed to navigate the complexities of loans, interest, and repayments. Take control of your financial future today by exploring the full capabilities of our loan management suite.</p>
            </div>
        </section>
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
        <title>LoanLens: Smart EMI & Loan Calculator for Comparison, Prepayment & Transfer</title>
        <meta name="description" content="Calculate EMI, compare loans, analyze balance transfers, and visualize prepayment impact. LoanLens is a free, smart financial calculator for all your loan management needs." />
        <meta name="keywords" content="loan calculator, emi calculator, home loan emi calculator, personal loan emi calculator, car loan emi calculator, bike loan calculator, loan comparison, interest rate, amortization schedule, loan prepayment, balance transfer, debt consolidation, financial tools, personal finance, iamtiksha" />
        <link rel="icon" href="https://www.iamtiksha.com/lifetools/emi-calculator/loanlenslogo.png" sizes="any" />
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
          id="adsense-script"
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4648414963251970"
          crossOrigin="anonymous"
          strategy="afterInteractive"
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

          <main className="flex-1 container py-8">
              {children}
          </main>
          
          <SeoContent />

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
