
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
      <div className="mb-8">
        <GoogleAd key={`${tab}-top`} adClient="ca-pub-YOUR_PUBLISHER_ID" adSlot="YOUR_AD_SLOT_ID_1" />
      </div>
      <LoanLensApp currency={currency} />
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
