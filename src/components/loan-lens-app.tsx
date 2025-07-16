
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from './ui/button';
import { Check, Copy, Info } from 'lucide-react';
import {
  calculateEMI,
  calculateTotalInterestAndPayment,
  calculatePrepayment,
} from '@/lib/loan-utils';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Line, LineChart } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const chartConfig = {
  principal: { label: 'Principal', color: 'hsl(var(--primary))' },
  interest: { label: 'Interest', color: 'hsl(var(--accent))' },
  loan1: { label: 'Loan 1', color: 'hsl(var(--primary))' },
  loan2: { label: 'Loan 2', color: 'hsl(var(--chart-2))' },
  withPrepayment: { label: 'With Prepayment', color: 'hsl(var(--primary))' },
  withoutPrepayment: { label: 'Without Prepayment', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

// A custom hook for debouncing
const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
};


const createQueryString = (params: Record<string, string | number>) => {
  const newSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    newSearchParams.set(key, String(value));
  }
  return newSearchParams.toString();
};

const NumberInputWithSlider = ({
  label,
  unit,
  value,
  onValueChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  unit: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}) => (
  <div className="space-y-4">
    <Label className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold text-primary">
        {format ? format(value) : value} {unit}
      </span>
    </Label>
    <div className="flex items-center space-x-4">
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <Input
        type="number"
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-28"
      />
    </div>
  </div>
);


function ShareButton() {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            toast({
                title: "Link Copied!",
                description: "You can now share this calculation.",
            });
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Share Link'}
        </Button>
    );
}

function EmiCalculator({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (params: Record<string, any>) => void }) {
  const [amount, setAmount] = useState(() => Number(searchParams.get('amount')) || 100000);
  const [rate, setRate] = useState(() => Number(searchParams.get('rate')) || 8.5);
  const [tenure, setTenure] = useState(() => Number(searchParams.get('tenure')) || 5);

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    return calculateTotalInterestAndPayment(amount, rate, tenure);
  }, [amount, rate, tenure]);

  useEffect(() => {
    updateUrl({ amount, rate, tenure });
  }, [amount, rate, tenure, updateUrl]);
  
  const pieData = [
    { name: 'Principal Amount', value: amount, fill: 'var(--color-principal)' },
    { name: 'Total Interest', value: totalInterest, fill: 'var(--color-interest)' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="font-headline">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <NumberInputWithSlider
            label="Loan Amount"
            unit={currency}
            value={amount}
            onValueChange={setAmount}
            min={1000}
            max={1000000}
            step={1000}
            format={(v) => formatCurrency(v, currency)}
          />
          <NumberInputWithSlider
            label="Interest Rate"
            unit="%"
            value={rate}
            onValueChange={setRate}
            min={1}
            max={20}
            step={0.1}
          />
          <NumberInputWithSlider
            label="Loan Tenure"
            unit="Years"
            value={tenure}
            onValueChange={setTenure}
            min={1}
            max={30}
            step={1}
          />
        </CardContent>
      </Card>
      <div className="space-y-8">
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline">Results</CardTitle>
              <ShareButton/>
            </div>
            <CardDescription>Your estimated monthly payment and total costs.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background text-center">
              <Label className="text-muted-foreground">Monthly EMI</Label>
              <p className="text-2xl font-bold text-primary">{formatCurrency(emi, currency)}</p>
            </div>
            <div className="p-4 rounded-lg bg-background text-center">
              <Label className="text-muted-foreground">Total Interest</Label>
              <p className="text-2xl font-bold">{formatCurrency(totalInterest, currency)}</p>
            </div>
            <div className="p-4 rounded-lg bg-background text-center">
              <Label className="text-muted-foreground">Total Payment</Label>
              <p className="text-2xl font-bold">{formatCurrency(totalPayment, currency)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="font-headline">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <RechartsTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatCurrency(Number(value), currency)} />} />
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5} />
                        <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


function LoanComparison({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (params: Record<string, any>) => void }) {
    const [loan1, setLoan1] = useState({
        amount: Number(searchParams.get('l1_amount')) || 100000,
        rate: Number(searchParams.get('l1_rate')) || 8.5,
        tenure: Number(searchParams.get('l1_tenure')) || 10,
    });
    const [loan2, setLoan2] = useState({
        amount: Number(searchParams.get('l2_amount')) || 100000,
        rate: Number(searchParams.get('l2_rate')) || 9.0,
        tenure: Number(searchParams.get('l2_tenure')) || 10,
    });

    useEffect(() => {
        updateUrl({
            l1_amount: loan1.amount, l1_rate: loan1.rate, l1_tenure: loan1.tenure,
            l2_amount: loan2.amount, l2_rate: loan2.rate, l2_tenure: loan2.tenure,
        });
    }, [loan1, loan2, updateUrl]);

    const result1 = calculateTotalInterestAndPayment(loan1.amount, loan1.rate, loan1.tenure);
    const result2 = calculateTotalInterestAndPayment(loan2.amount, loan2.rate, loan2.tenure);
    
    const comparisonData = [
        { name: 'Monthly EMI', loan1: result1.emi, loan2: result2.emi },
        { name: 'Total Interest', loan1: result1.totalInterest, loan2: result2.totalInterest },
        { name: 'Total Payment', loan1: result1.totalPayment, loan2: result2.totalPayment },
    ];
    
    const savings = result1.totalPayment - result2.totalPayment;

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline text-primary">Loan 1 Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <NumberInputWithSlider label="Amount" unit={currency} value={loan1.amount} onValueChange={(v) => setLoan1({...loan1, amount: v})} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                     <NumberInputWithSlider label="Interest Rate" unit="%" value={loan1.rate} onValueChange={(v) => setLoan1({...loan1, rate: v})} min={1} max={20} step={0.1} />
                     <NumberInputWithSlider label="Tenure" unit="Years" value={loan1.tenure} onValueChange={(v) => setLoan1({...loan1, tenure: v})} min={1} max={30} step={1} />
                </CardContent>
            </Card>
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline text-chart-2">Loan 2 Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <NumberInputWithSlider label="Amount" unit={currency} value={loan2.amount} onValueChange={(v) => setLoan2({...loan2, amount: v})} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                    <NumberInputWithSlider label="Interest Rate" unit="%" value={loan2.rate} onValueChange={(v) => setLoan2({...loan2, rate: v})} min={1} max={20} step={0.1} />
                    <NumberInputWithSlider label="Tenure" unit="Years" value={loan2.tenure} onValueChange={(v) => setLoan2({...loan2, tenure: v})} min={1} max={30} step={1} />
                </CardContent>
            </Card>
            <div className="space-y-8 lg:col-span-3">
                 <Card className="bg-card/50">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="font-headline">Comparison</CardTitle>
                            <ShareButton/>
                        </div>
                        <CardDescription>
                            Comparing the two loan offers side-by-side. 
                            {savings !== 0 && (
                                <span className={cn("font-bold", savings > 0 ? "text-green-600" : "text-red-600")}>
                                    {' '}Choosing Loan 2 could {savings > 0 ? 'save you' : 'cost you an extra'} {formatCurrency(Math.abs(savings), currency)}.
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCurrency(Number(value), currency, 0)} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                                        content={<ChartTooltipContent formatter={(value, name) => <div><span className="font-bold">{name === 'loan1' ? 'Loan 1:' : 'Loan 2:'}</span> {formatCurrency(Number(value), currency)}</div>} />}
                                    />
                                    <Legend />
                                    <Bar dataKey="loan1" fill="var(--color-loan1)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="loan2" fill="var(--color-loan2)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function BalanceTransferAnalysis({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (params: Record<string, any>) => void }) {
    const [currentLoan, setCurrentLoan] = useState({
        principal: Number(searchParams.get('c_principal')) || 50000,
        rate: Number(searchParams.get('c_rate')) || 12,
        tenure: Number(searchParams.get('c_tenure')) || 3,
    });
    const [newLoan, setNewLoan] = useState({
        rate: Number(searchParams.get('n_rate')) || 9,
        tenure: Number(searchParams.get('n_tenure')) || 3,
        fee: Number(searchParams.get('n_fee')) || 1,
    });
    
    useEffect(() => {
        updateUrl({
            c_principal: currentLoan.principal, c_rate: currentLoan.rate, c_tenure: currentLoan.tenure,
            n_rate: newLoan.rate, n_tenure: newLoan.tenure, n_fee: newLoan.fee,
        });
    }, [currentLoan, newLoan, updateUrl]);

    const currentResult = calculateTotalInterestAndPayment(currentLoan.principal, currentLoan.rate, currentLoan.tenure);
    const newFeeAmount = (currentLoan.principal * newLoan.fee) / 100;
    const newPrincipal = currentLoan.principal + newFeeAmount;
    const newResult = calculateTotalInterestAndPayment(newPrincipal, newLoan.rate, newLoan.tenure);

    const totalSavings = currentResult.totalPayment - newResult.totalPayment;

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className='space-y-8'>
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline">Current Loan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <NumberInputWithSlider label="Outstanding Principal" unit={currency} value={currentLoan.principal} onValueChange={(v) => setCurrentLoan({...currentLoan, principal: v})} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                        <NumberInputWithSlider label="Interest Rate" unit="%" value={currentLoan.rate} onValueChange={(v) => setCurrentLoan({...currentLoan, rate: v})} min={1} max={20} step={0.1} />
                        <NumberInputWithSlider label="Remaining Tenure" unit="Years" value={currentLoan.tenure} onValueChange={(v) => setCurrentLoan({...currentLoan, tenure: v})} min={1} max={30} step={1} />
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline">New Loan Offer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <NumberInputWithSlider label="New Interest Rate" unit="%" value={newLoan.rate} onValueChange={(v) => setNewLoan({...newLoan, rate: v})} min={1} max={20} step={0.1} />
                        <NumberInputWithSlider label="New Loan Tenure" unit="Years" value={newLoan.tenure} onValueChange={(v) => setNewLoan({...newLoan, tenure: v})} min={1} max={30} step={1} />
                        <NumberInputWithSlider label="Processing Fee" unit="%" value={newLoan.fee} onValueChange={(v) => setNewLoan({...newLoan, fee: v})} min={0} max={5} step={0.1} />
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                     <div className="flex justify-between items-center">
                        <CardTitle className="font-headline">Analysis</CardTitle>
                        <ShareButton/>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className={cn("p-6 rounded-lg text-center", totalSavings > 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50')}>
                        <Label className={cn("text-lg", totalSavings > 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200')}>
                            {totalSavings > 0 ? 'Total Potential Savings' : 'Net Loss'}
                        </Label>
                        <p className={cn("text-4xl font-bold", totalSavings > 0 ? 'text-green-600' : 'text-red-600')}>
                            {formatCurrency(Math.abs(totalSavings), currency)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">Current Total Payment</Label>
                            <p className="text-xl font-semibold">{formatCurrency(currentResult.totalPayment, currency)}</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">New Total Payment (incl. fee)</Label>
                            <p className="text-xl font-semibold">{formatCurrency(newResult.totalPayment, currency)}</p>
                        </div>
                         <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">Current EMI</Label>
                            <p className="text-xl font-semibold">{formatCurrency(currentResult.emi, currency)}</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">New EMI</Label>
                            <p className="text-xl font-semibold">{formatCurrency(newResult.emi, currency)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PrepaymentImpactAnalysis({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (params: Record<string, any>) => void }) {
    const [loan, setLoan] = useState({
        amount: Number(searchParams.get('p_amount')) || 200000,
        rate: Number(searchParams.get('p_rate')) || 9.5,
        tenure: Number(searchParams.get('p_tenure')) || 20,
        prepayment: Number(searchParams.get('p_prepayment')) || 1000,
    });
    
    useEffect(() => {
        updateUrl({
            p_amount: loan.amount, p_rate: loan.rate, p_tenure: loan.tenure, p_prepayment: loan.prepayment
        });
    }, [loan, updateUrl]);

    const originalResult = calculateTotalInterestAndPayment(loan.amount, loan.rate, loan.tenure);
    const prepaymentResult = calculatePrepayment(loan.amount, loan.rate, loan.tenure, loan.prepayment);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline">Loan & Prepayment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <NumberInputWithSlider label="Loan Amount" unit={currency} value={loan.amount} onValueChange={(v) => setLoan({...loan, amount: v})} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                    <NumberInputWithSlider label="Interest Rate" unit="%" value={loan.rate} onValueChange={(v) => setLoan({...loan, rate: v})} min={1} max={20} step={0.1} />
                    <NumberInputWithSlider label="Loan Tenure" unit="Years" value={loan.tenure} onValueChange={(v) => setLoan({...loan, tenure: v})} min={1} max={30} step={1} />
                    <NumberInputWithSlider label="Monthly Prepayment" unit={currency} value={loan.prepayment} onValueChange={(v) => setLoan({...loan, prepayment: v})} min={0} max={10000} step={100} format={(v) => formatCurrency(v, currency)} />
                </CardContent>
            </Card>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="font-headline">Prepayment Impact</CardTitle>
                            <ShareButton/>
                        </div>
                        <CardDescription>See how extra monthly payments can save you money and shorten your loan term.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <Label className="text-green-800 dark:text-green-200">Interest Saved</Label>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(prepaymentResult.interestSaved, currency)}</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">Tenure Reduced By</Label>
                            <p className="text-2xl font-bold">{prepaymentResult.tenureReducedMonths} months</p>
                        </div>
                        <div className="p-4 bg-background rounded-lg">
                            <Label className="text-muted-foreground">New Tenure</Label>
                            <p className="text-2xl font-bold">{prepaymentResult.newTenureYears} years</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Amortization Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={prepaymentResult.amortizationData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="year" name="Year" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis tickFormatter={(value) => formatCurrency(Number(value), currency, 0)} stroke="hsl(var(--muted-foreground))" />
                                    <RechartsTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value), currency)} />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="withoutPrepayment" stroke="var(--color-withoutPrepayment)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="withPrepayment" stroke="var(--color-withPrepayment)" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

export function LoanLensApp({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const defaultTab = searchParams?.tab || 'emi-calculator';
  const [currency, setCurrency] = useState(() => currentSearchParams.get('currency') || 'USD');

  const updateUrl = useDebouncedCallback((params: Record<string, any>) => {
    const newParams = new URLSearchParams(currentSearchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    router.replace(`${pathname}?${newParams.toString()}`);
  }, 500);
  
  const onTabChange = (tab: string) => {
    const newParams = new URLSearchParams();
    // copy existing params
    currentSearchParams.forEach((value, key) => {
        if(key !== 'tab') {
            newParams.set(key, value);
        }
    });
    newParams.set('tab', tab);
    router.replace(`${pathname}?${newParams.toString()}`);
  }

  const handleCurrencyChange = (newCurrency: string) => {
      setCurrency(newCurrency);
      updateUrl({ currency: newCurrency });
  }

  return (
    <TooltipProvider>
      <div className="container py-8">
        <div className="flex justify-end mb-4">
            <div className="w-40">
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
        </div>
        <Tabs defaultValue={defaultTab as string} className="w-full" onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="emi-calculator">EMI Calculator</TabsTrigger>
            <TabsTrigger value="loan-comparison">Loan Comparison</TabsTrigger>
            <TabsTrigger value="balance-transfer">Balance Transfer</TabsTrigger>
            <TabsTrigger value="prepayment-impact">Prepayment Impact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="emi-calculator">
              <EmiCalculator currency={currency} searchParams={currentSearchParams} updateUrl={(params) => updateUrl({...params, tab: 'emi-calculator', currency})} />
          </TabsContent>
          <TabsContent value="loan-comparison">
              <LoanComparison currency={currency} searchParams={currentSearchParams} updateUrl={(params) => updateUrl({...params, tab: 'loan-comparison', currency})} />
          </TabsContent>
          <TabsContent value="balance-transfer">
              <BalanceTransferAnalysis currency={currency} searchParams={currentSearchParams} updateUrl={(params) => updateUrl({...params, tab: 'balance-transfer', currency})} />
          </TabsContent>
          <TabsContent value="prepayment-impact">
              <PrepaymentImpactAnalysis currency={currency} searchParams={currentSearchParams} updateUrl={(params) => updateUrl({...params, tab: 'prepayment-impact', currency})} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
