
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoanLensApp } from '@/components/loan-lens-app';
import { GoogleAd } from '@/components/google-ad';

function LoanLensPage() {
  const searchParams = useSearchParams();
  const currency = searchParams.get('currency') || 'INR';
  const tab = searchParams.get('tab') || 'emi-calculator';

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">
            Smart Loan & EMI Calculator
        </h1>
        <p className="text-lg text-muted-foreground">
            Analyze, compare, and optimize your loans with powerful financial tools.
        </p>
      </div>
      <div className="mb-8">
         <GoogleAd key={tab} adClient="ca-pub-YOUR_PUBLISHER_ID" adSlot="YOUR_AD_SLOT_ID_1" />
      </div>
      <LoanLensApp key={`${tab}-${currency}`} currency={currency} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading Calculator...</div>}>
      <LoanLensPage />
    </Suspense>
  );
}
