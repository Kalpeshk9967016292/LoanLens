
"use client";

import { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LoanLensApp } from '@/components/loan-lens-app';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '@/lib/loan-utils';

function AdPlaceholder({ id, description }: { id: string, description: string }) {
  return (
    <div id={id} className="container my-4 text-center">
      <div 
        className="w-full h-24 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed"
        data-ai-hint="advertisement banner"
      >
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const [currency, setCurrency] = useState(() => {
    const urlCurrency = currentSearchParams.get('currency');
    if (urlCurrency && currencies.includes(urlCurrency)) return urlCurrency;
    return 'INR';
  });

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    const newParams = new URLSearchParams(currentSearchParams.toString());
    newParams.set('currency', newCurrency);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [currentSearchParams, pathname, router]);

  useEffect(() => {
    if (!currentSearchParams.has('currency')) {
        const newParams = new URLSearchParams(currentSearchParams.toString());
        newParams.set('currency', currency);
        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, currentSearchParams, pathname, router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AdPlaceholder id="ad-slot-top" description="Top Ad Banner" />

      <main className="flex-1">
        <Suspense fallback={<div className="container py-8">Loading...</div>}>
          <LoanLensApp currency={currency} />
        </Suspense>
      </main>

      <AdPlaceholder id="ad-slot-bottom" description="Bottom Ad Banner" />

      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            A smart financial tool built with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
