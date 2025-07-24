
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { CalendarIcon, Check, Copy, Info, PlusCircle, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  calculateEMI,
  calculateTotalInterestAndPayment,
  calculatePrepayment,
  generateAmortizationSchedule,
  YearlyAmortization
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const chartConfig = {
  principal: { label: 'Principal', color: 'hsl(var(--primary))' },
  interest: { label: 'Interest', color: 'hsl(var(--accent))' },
  loan1: { label: 'Loan 1', color: 'hsl(var(--primary))' },
  loan2: { label: 'Loan 2', color: 'hsl(var(--chart-2))' },
  withPrepayment: { label: 'With Prepayment', color: 'hsl(var(--primary))' },
  withoutPrepayment: { label: 'Without Prepayment', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

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
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <Slider
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <Input
        type="number"
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full sm:w-28"
      />
    </div>
  </div>
);


function ShareButton({ getShareUrl }: { getShareUrl: () => string }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const shareUrl = getShareUrl();
        navigator.clipboard.writeText(shareUrl).then(() => {
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

const AmortizationTable = ({ schedule, currency }: { schedule: YearlyAmortization[], currency: string }) => {
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});

    const toggleYear = (year: string) => {
        setExpandedYears(prev => ({...prev, [year]: !prev[year]}));
    }

    return (
      <div className="w-full overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-1/6">Year</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Total Payment</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right w-1/6">Loan Paid To Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {schedule.map(yearData => (
                    <React.Fragment key={yearData.year}>
                        <TableRow onClick={() => toggleYear(yearData.year)} className="cursor-pointer bg-muted/20 hover:bg-muted/50">
                            <TableCell className="font-medium">
                                <div className="flex items-center">
                                    {expandedYears[yearData.year] ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                    {yearData.year}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(yearData.principalPaid, currency)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(yearData.interestPaid, currency)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(yearData.totalPayment, currency)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(yearData.balance, currency)}</TableCell>
                            <TableCell className="text-right">{yearData.loanPaidToDate.toFixed(2)}%</TableCell>
                        </TableRow>
                        {expandedYears[yearData.year] && yearData.months.map(monthData => (
                             <TableRow key={`${yearData.year}-${monthData.month}`} className="bg-background hover:bg-muted/30">
                                <TableCell className="pl-12 text-sm text-muted-foreground">{monthData.month}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(monthData.principalPaid, currency)}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(monthData.interestPaid, currency)}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(monthData.emi, currency)}</TableCell>
                                <TableCell className="text-right text-sm">{formatCurrency(monthData.balance, currency)}</TableCell>
                                <TableCell className="text-right text-sm">{monthData.loanPaidToDate.toFixed(2)}%</TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                ))}
            </TableBody>
        </Table>
      </div>
    )
}

function EmiCalculator({ currency }: { currency: string }) {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(5);
  const [startDate, setStartDate] = useState(new Date());

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    return calculateTotalInterestAndPayment(amount, rate, tenure);
  }, [amount, rate, tenure]);

  const amortizationSchedule = useMemo(() => {
    return generateAmortizationSchedule(amount, rate, tenure, startDate);
  }, [amount, rate, tenure, startDate]);
  
  const pieData = [
    { name: 'Principal Amount', value: amount, fill: 'var(--color-principal)' },
    { name: 'Total Interest', value: totalInterest, fill: 'var(--color-interest)' },
  ];

  const getShareUrl = () => {
    const params = new URLSearchParams();
    params.set('tab', 'emi-calculator');
    params.set('amount', String(amount));
    params.set('rate', String(rate));
    params.set('tenure', String(tenure));
    params.set('startDate', startDate.toISOString());
    params.set('currency', currency);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

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
              <ShareButton getShareUrl={getShareUrl} />
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
            <CardDescription>A detailed breakdown of your payments over the loan tenure.</CardDescription>
        </CardHeader>
        <CardContent>
            <AmortizationTable schedule={amortizationSchedule} currency={currency} />
        </CardContent>
    </Card>
    )}
    </div>
  );
}


function LoanComparison({ currency }: { currency: string }) {
    const [loans, setLoans] = useState([
        { id: Date.now() + 1, name: 'Loan 1', amount: 100000, rate: 8.5, tenure: 10 },
        { id: Date.now() + 2, name: 'Loan 2', amount: 100000, rate: 9.0, tenure: 10 },
    ]);

    const handleLoanChange = (id: number, field: string, value: string | number) => {
        setLoans(loans.map(loan => loan.id === id ? { ...loan, [field]: value } : loan));
    };

    const addLoan = () => {
        if (loans.length < 5) {
            const newLoan = { id: Date.now(), name: `Loan ${loans.length + 1}`, amount: 100000, rate: 10, tenure: 15 };
            setLoans([...loans, newLoan]);
        }
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
    
    const getShareUrl = () => {
        const params = new URLSearchParams();
        params.set('tab', 'loan-comparison');
        params.set('loans', JSON.stringify(loans.map(({id, ...rest}) => rest)));
        params.set('currency', currency);
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    };

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
                 {loans.length < 5 && (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <Button variant="outline" className="w-full h-full border-dashed" onClick={addLoan}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Add Another Loan
                        </Button>
                    </div>
                )}
            </div>
            <Card className="bg-card/50">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline">Comparison Results</CardTitle>
                        <ShareButton getShareUrl={getShareUrl} />
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

function BalanceTransferAnalysis({ currency }: { currency: string }) {
    const [currentLoan, setCurrentLoan] = useState({
        principal: 50000,
        rate: 12,
        tenure: 3,
    });
    const [newLoan, setNewLoan] = useState({
        rate: 9,
        tenure: 3,
        fee: 1,
    });
    
    const currentResult = calculateTotalInterestAndPayment(currentLoan.principal, currentLoan.rate, currentLoan.tenure);
    const newFeeAmount = (currentLoan.principal * newLoan.fee) / 100;
    const newPrincipal = currentLoan.principal + newFeeAmount;
    const newResult = calculateTotalInterestAndPayment(newPrincipal, newLoan.rate, newLoan.tenure);

    const totalSavings = currentResult.totalPayment - newResult.totalPayment;
    
    const getShareUrl = () => {
        const params = new URLSearchParams();
        params.set('tab', 'balance-transfer');
        params.set('clp', String(currentLoan.principal));
        params.set('clr', String(currentLoan.rate));
        params.set('clt', String(currentLoan.tenure));
        params.set('nlr', String(newLoan.rate));
        params.set('nlt', String(newLoan.tenure));
        params.set('nlf', String(newLoan.fee));
        params.set('currency', currency);
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    };

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
                        <ShareButton getShareUrl={getShareUrl}/>
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

function PrepaymentImpactAnalysis({ currency }: { currency: string }) {
    const [loan, setLoan] = useState({
        amount: 200000,
        rate: 9.5,
        tenure: 20,
        prepayment: 1000,
    });
    
    const originalResult = calculateTotalInterestAndPayment(loan.amount, loan.rate, loan.tenure);
    const prepaymentResult = calculatePrepayment(loan.amount, loan.rate, loan.tenure, loan.prepayment);
    
    const getShareUrl = () => {
        const params = new URLSearchParams();
        params.set('tab', 'prepayment-impact');
        params.set('amount', String(loan.amount));
        params.set('rate', String(loan.rate));
        params.set('tenure', String(loan.tenure));
        params.set('prepayment', String(loan.prepayment));
        params.set('currency', currency);
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    };

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
                            <ShareButton getShareUrl={getShareUrl} />
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

export function LoanLensApp({ currency }: { currency: string }) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'emi-calculator';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const onTabChange = (tab: string) => {
    setActiveTab(tab);
  }

  return (
    <TooltipProvider>
      <Tabs value={activeTab} className="w-full" onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto flex-wrap">
          <TabsTrigger value="emi-calculator">EMI Calculator</TabsTrigger>
          <TabsTrigger value="loan-comparison">Loan Comparison</TabsTrigger>
          <TabsTrigger value="balance-transfer">Balance Transfer</TabsTrigger>
          <TabsTrigger value="prepayment-impact">Prepayment Impact</TabsTrigger>
        </TabsList>
        
        <TabsContent value="emi-calculator">
            <EmiCalculator currency={currency} />
        </TabsContent>
        <TabsContent value="loan-comparison">
            <LoanComparison currency={currency} />
        </TabsContent>
        <TabsContent value="balance-transfer">
            <BalanceTransferAnalysis currency={currency} />
        </TabsContent>
        <TabsContent value="prepayment-impact">
            <PrepaymentImpactAnalysis currency={currency} />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}

    