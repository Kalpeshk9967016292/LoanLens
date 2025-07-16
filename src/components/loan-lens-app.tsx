
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { CalendarIcon, Check, Copy, Info, PlusCircle, Trash2 } from 'lucide-react';
import {
  calculateEMI,
  calculateTotalInterestAndPayment,
  calculatePrepayment,
  generateAmortizationSchedule,
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';

const chartConfig = {
  principal: { label: 'Principal', color: 'hsl(var(--primary))' },
  interest: { label: 'Interest', color: 'hsl(var(--accent))' },
  loan1: { label: 'Loan 1', color: 'hsl(var(--primary))' },
  loan2: { label: 'Loan 2', color: 'hsl(var(--chart-2))' },
  withPrepayment: { label: 'With Prepayment', color: 'hsl(var(--primary))' },
  withoutPrepayment: { label: 'Without Prepayment', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
    
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
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

function DatePicker({ date, setDate, label }: { date: Date, setDate: (date: Date) => void, label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function EmiCalculator({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (params: Record<string, any>) => void }) {
  const [amount, setAmount] = useState(() => Number(searchParams.get('amount')) || 100000);
  const [rate, setRate] = useState(() => Number(searchParams.get('rate')) || 8.5);
  const [tenure, setTenure] = useState(() => Number(searchParams.get('tenure')) || 5);
  const [startDate, setStartDate] = useState(() => {
      const dateStr = searchParams.get('startDate');
      return dateStr ? new Date(dateStr) : new Date();
  });

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    return calculateTotalInterestAndPayment(amount, rate, tenure);
  }, [amount, rate, tenure]);

  const amortizationSchedule = useMemo(() => {
    return generateAmortizationSchedule(amount, rate, tenure, startDate);
  }, [amount, rate, tenure, startDate]);

  const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 500);

  useEffect(() => {
    debouncedUpdateUrl({ amount, rate, tenure, startDate: startDate.toISOString() });
  }, [amount, rate, tenure, startDate, debouncedUpdateUrl]);
  
  const pieData = [
    { name: 'Principal Amount', value: amount, fill: 'var(--color-principal)' },
    { name: 'Total Interest', value: totalInterest, fill: 'var(--color-interest)' },
  ];

  return (
    <div className="space-y-8">
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
            max={100}
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
          <DatePicker date={startDate} setDate={setStartDate} label="Loan Start Date" />
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
    {amortizationSchedule.length > 0 && (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Amortization Schedule</CardTitle>
            <CardDescription>A detailed breakdown of your monthly payments over the loan tenure.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader className='sticky top-0 bg-background'>
                        <TableRow>
                            <TableHead className="w-[120px]">Month-Year</TableHead>
                            <TableHead className="text-right">EMI</TableHead>
                            <TableHead className="text-right">Interest Paid</TableHead>
                            <TableHead className="text-right">Principal Paid</TableHead>
                            <TableHead className="text-right">Outstanding Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {amortizationSchedule.map((row) => (
                            <TableRow key={row.month}>
                                <TableCell className="font-medium">{row.month}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.emi, currency)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.interestPaid, currency)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.principalPaid, currency)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.balance, currency)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
    )}
    </div>
  );
}


function LoanComparison({ currency, searchParams, updateUrl }: { currency: string, searchParams: URLSearchParams, updateUrl: (newParams: Record<string, any>, clearLoanParams?: boolean) => void }) {
    const initialLoans = () => {
        const loansFromUrl = [];
        let i = 0;
        while (searchParams.has(`l${i}_amount`)) {
            loansFromUrl.push({
                id: Date.now() + i,
                name: searchParams.get(`l${i}_name`) || `Loan ${i + 1}`,
                amount: Number(searchParams.get(`l${i}_amount`)) || 100000,
                rate: Number(searchParams.get(`l${i}_rate`)) || 8.5,
                tenure: Number(searchParams.get(`l${i}_tenure`)) || 10,
            });
            i++;
        }
        if (loansFromUrl.length === 0) {
            return [
                { id: Date.now() + 1, name: 'Loan 1', amount: 100000, rate: 8.5, tenure: 10 },
                { id: Date.now() + 2, name: 'Loan 2', amount: 100000, rate: 9.0, tenure: 10 },
            ];
        }
        return loansFromUrl;
    };

    const [loans, setLoans] = useState(initialLoans);
    const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 500);

    useEffect(() => {
        const params = {};
        loans.forEach((loan, index) => {
            params[`l${index}_name`] = loan.name;
            params[`l${index}_amount`] = loan.amount;
            params[`l${index}_rate`] = loan.rate;
            params[`l${index}_tenure`] = loan.tenure;
        });
        debouncedUpdateUrl(params, true);
    }, [loans, debouncedUpdateUrl]);

    const handleLoanChange = (id: number, field: string, value: string | number) => {
        setLoans(loans.map(loan => loan.id === id ? { ...loan, [field]: value } : loan));
    };

    const addLoan = () => {
        const newLoan = { id: Date.now(), name: `Loan ${loans.length + 1}`, amount: 100000, rate: 10, tenure: 15 };
        setLoans([...loans, newLoan]);
    };

    const removeLoan = (id: number) => {
        if (loans.length > 1) {
            setLoans(loans.filter(loan => loan.id !== id));
        }
    };

    const loanResults = useMemo(() => loans.map(loan => calculateTotalInterestAndPayment(loan.amount, loan.rate, loan.tenure)), [loans]);

    const comparisonData = useMemo(() => {
        const dataPoints = ['Monthly EMI', 'Total Interest', 'Total Payment'];
        return dataPoints.map(name => {
            const entry = { name };
            loanResults.forEach((result, i) => {
                const key = name.toLowerCase().replace(' ', '');
                entry[`loan${i}`] = result[key === 'monthlyemi' ? 'emi' : key];
            });
            return entry;
        });
    }, [loanResults]);

    const dynamicChartConfig: ChartConfig = useMemo(() => {
        const config = {};
        loans.forEach((loan, i) => {
            config[`loan${i}`] = { label: loan.name, color: `hsl(var(--chart-${(i % 5) + 1}))` };
        });
        return config;
    }, [loans]);

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loans.map((loan, index) => (
                    <Card key={loan.id} className="bg-card/50 flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="font-headline text-lg" style={{ color: `hsl(var(--chart-${(index % 5) + 1}))` }}>
                                <Input
                                    value={loan.name}
                                    onChange={(e) => handleLoanChange(loan.id, 'name', e.target.value)}
                                    className="text-lg font-semibold p-0 h-auto border-none focus-visible:ring-0 bg-transparent"
                                    style={{ color: `hsl(var(--chart-${(index % 5) + 1}))` }}
                                />
                            </CardTitle>
                            {loans.length > 1 && (
                                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => removeLoan(loan.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6 flex-grow pt-4">
                             <NumberInputWithSlider label="Amount" unit={currency} value={loan.amount} onValueChange={(v) => handleLoanChange(loan.id, 'amount', v)} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                             <NumberInputWithSlider label="Interest Rate" unit="%" value={loan.rate} onValueChange={(v) => handleLoanChange(loan.id, 'rate', v)} min={1} max={100} step={0.1} />
                             <NumberInputWithSlider label="Tenure" unit="Years" value={loan.tenure} onValueChange={(v) => handleLoanChange(loan.id, 'tenure', v)} min={1} max={30} step={1} />
                        </CardContent>
                    </Card>
                ))}
                 <div className="flex items-center justify-center min-h-[300px]">
                    <Button variant="outline" className="w-full h-full border-dashed" onClick={addLoan}>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add Another Loan
                    </Button>
                </div>
            </div>
            <Card className="bg-card/50">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline">Comparison Results</CardTitle>
                        <ShareButton/>
                    </div>
                    <CardDescription>
                        A side-by-side comparison of your loan options.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={dynamicChartConfig} className="min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCurrency(Number(value), currency, 0)} />
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                                    content={<ChartTooltipContent formatter={(value, name) => <div><span className="font-bold">{dynamicChartConfig[name]?.label || name}:</span> {formatCurrency(Number(value), currency)}</div>} />}
                                />
                                <Legend />
                                {loans.map((_, i) => (
                                    <Bar key={`bar-${i}`} dataKey={`loan${i}`} fill={`var(--color-loan${i})`} radius={[4, 4, 0, 0]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
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
    const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 500);
    
    useEffect(() => {
        debouncedUpdateUrl({
            c_principal: currentLoan.principal, c_rate: currentLoan.rate, c_tenure: currentLoan.tenure,
            n_rate: newLoan.rate, n_tenure: newLoan.tenure, n_fee: newLoan.fee,
        });
    }, [currentLoan, newLoan, debouncedUpdateUrl]);

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
                        <NumberInputWithSlider label="Interest Rate" unit="%" value={currentLoan.rate} onValueChange={(v) => setCurrentLoan({...currentLoan, rate: v})} min={1} max={100} step={0.1} />
                        <NumberInputWithSlider label="Remaining Tenure" unit="Years" value={currentLoan.tenure} onValueChange={(v) => setCurrentLoan({...currentLoan, tenure: v})} min={1} max={30} step={1} />
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline">New Loan Offer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <NumberInputWithSlider label="New Interest Rate" unit="%" value={newLoan.rate} onValueChange={(v) => setNewLoan({...newLoan, rate: v})} min={1} max={100} step={0.1} />
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
    const debouncedUpdateUrl = useDebouncedCallback(updateUrl, 500);

    useEffect(() => {
        debouncedUpdateUrl({
            p_amount: loan.amount, p_rate: loan.rate, p_tenure: loan.tenure, p_prepayment: loan.prepayment
        });
    }, [loan, debouncedUpdateUrl]);

    const originalResult = calculateTotalInterestAndPayment(loan.amount, loan.rate, loan.tenure);
    const prepaymentResult = calculatePrepayment(loan.amount, loan.rate, loan.tenure, loan.prepayment);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="font-headline">Loan &amp; Prepayment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <NumberInputWithSlider label="Loan Amount" unit={currency} value={loan.amount} onValueChange={(v) => setLoan({...loan, amount: v})} min={1000} max={1000000} step={1000} format={(v) => formatCurrency(v, currency)} />
                    <NumberInputWithSlider label="Interest Rate" unit="%" value={loan.rate} onValueChange={(v) => setLoan({...loan, rate: v})} min={1} max={100} step={0.1} />
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
  const defaultTab = currentSearchParams.get('tab') || 'emi-calculator';
  const [currency, setCurrency] = useState(() => {
    const urlCurrency = currentSearchParams.get('currency');
    if (urlCurrency && currencies.includes(urlCurrency)) return urlCurrency;
    return 'INR';
  });

  const updateUrl = useCallback((params: Record<string, any>, clearLoanParams = false) => {
    const newParams = new URLSearchParams(currentSearchParams.toString());
    
    if (clearLoanParams) {
        for (const key of Array.from(newParams.keys())) {
            if (key.startsWith('l') && (key.endsWith('_amount') || key.endsWith('_rate') || key.endsWith('_tenure') || key.endsWith('_name'))) {
                newParams.delete(key);
            }
        }
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [currentSearchParams, pathname, router]);
  
  const onTabChange = (tab: string) => {
    const newParams = new URLSearchParams(window.location.search);
    const paramsToKeep = ['currency'];
    const currentParams = new URLSearchParams(window.location.search);
    const newSearch = new URLSearchParams();
    
    paramsToKeep.forEach(p => {
        if(currentParams.has(p)) newSearch.set(p, currentParams.get(p)!);
    });
    newSearch.set('tab', tab);
    router.replace(`${pathname}?${newSearch.toString()}`, { scroll: false });
  }

  const handleCurrencyChange = (newCurrency: string) => {
      setCurrency(newCurrency);
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('currency', newCurrency);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  }
  
  useEffect(() => {
    // Set initial currency in URL if not present
    if (!currentSearchParams.has('currency')) {
        handleCurrencyChange(currency);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <LoanComparison currency={currency} searchParams={currentSearchParams} updateUrl={(params, clear) => updateUrl({...params, tab: 'loan-comparison', currency}, clear)} />
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
