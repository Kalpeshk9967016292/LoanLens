
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoanLensApp } from '@/components/loan-lens-app';

function LoanLensPage() {
  const searchParams = useSearchParams();
  const currency = searchParams.get('currency') || 'INR';
  const tab = searchParams.get('tab') || 'emi-calculator';

  return (
    <LoanLensApp key={tab} currency={currency} />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading Calculator...</div>}>
      <LoanLensPage />
    </Suspense>
  );
}
