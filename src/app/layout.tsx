import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'LoanLens | Smart Loan & EMI Calculator',
  description: 'Smart loan analysis and comparison tool. Calculate EMI, compare loans, analyze balance transfers, and see the impact of prepayments. Make informed financial decisions with LoanLens.',
  keywords: ['loan calculator', 'emi calculator', 'loan comparison', 'interest rate', 'amortization schedule', 'loan prepayment', 'balance transfer', 'financial tools', 'personal finance'],
  openGraph: {
    title: 'LoanLens | Smart Loan & EMI Calculator',
    description: 'A smart financial tool to analyze and compare loans with ease.',
    url: 'https://loanlens.app', // Replace with your actual domain
    siteName: 'LoanLens',
    images: [
      {
        url: '/og-image.png', // Make sure to create this image and place it in the public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoanLens | Smart Loan & EMI Calculator',
    description: 'A smart financial tool to analyze and compare loans with ease.',
    images: ['/twitter-image.png'], // Make sure to create this image and place it in the public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased'
        )}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        
        <Script 
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
