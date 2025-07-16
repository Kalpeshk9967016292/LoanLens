import 'server-only';
import { headers } from 'next/headers';
import { suggestCurrency } from '@/ai/flows/suggest-currency-flow';
import { ReactNode, Suspense } from 'react';

async function CurrencySuggestion({ children }: { children: (suggestedCurrency: string | null) => ReactNode }) {
    const headersList = headers();
    const country = headersList.get('x-vercel-ip-country');
    
    let suggestedCurrency: string | null = 'USD';
    if (country) {
        try {
            const result = await suggestCurrency({ countryCode: country });
            if (result.currency) {
                suggestedCurrency = result.currency;
            }
        } catch (error) {
            console.error("Could not fetch currency suggestion, falling back to USD:", error);
            // Fallback to USD
            suggestedCurrency = 'USD';
        }
    }


    return <>{children(suggestedCurrency)}</>;
}

export function CurrencyDetector({ children }: { children: (suggestedCurrency: string | null) => ReactNode }) {
  return (
    <Suspense fallback={<>{children(null)}</>}>
      <CurrencySuggestion>{children}</CurrencySuggestion>
    </Suspense>
  );
}
