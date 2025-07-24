import { addMonths, format } from 'date-fns';

export const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

export const calculateEMI = (principal: number, annualRate: number, tenureYears: number): number => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return 0;

    const monthlyRate = annualRate / 12 / 100;
    const tenureMonths = tenureYears * 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return isNaN(emi) ? 0 : emi;
};

export const calculateTotalInterestAndPayment = (principal: number, annualRate: number, tenureYears: number) => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) {
        return { emi: 0, totalPayment: 0, totalInterest: 0 };
    }
    const emi = calculateEMI(principal, annualRate, tenureYears);
    const tenureMonths = tenureYears * 12;
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;

    return {
        emi,
        totalPayment,
        totalInterest,
    };
};

export interface MonthlyAmortization {
    month: string;
    emi: number;
    interestPaid: number;
    principalPaid: number;
    balance: number;
    loanPaidToDate: number;
}

export interface YearlyAmortization {
    year: string;
    principalPaid: number;
    interestPaid: number;
    totalPayment: number;
    balance: number;
    loanPaidToDate: number;
    months: MonthlyAmortization[];
}

export const generateAmortizationSchedule = (
    principal: number,
    annualRate: number,
    tenureYears: number,
    startDate: Date
): YearlyAmortization[] => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) {
        return [];
    }

    const monthlyRate = annualRate / 12 / 100;
    const tenureMonths = tenureYears * 12;
    const emi = calculateEMI(principal, annualRate, tenureYears);

    if (emi === 0 || !isFinite(emi)) {
        return [];
    }

    const schedule: Record<string, YearlyAmortization> = {};
    let balance = principal;

    for (let i = 0; i < tenureMonths; i++) {
        const currentDate = addMonths(startDate, i);
        const year = format(currentDate, 'yyyy');
        const month = format(currentDate, 'MMM');

        if (!schedule[year]) {
            schedule[year] = {
                year: year,
                principalPaid: 0,
                interestPaid: 0,
                totalPayment: 0,
                balance: 0,
                loanPaidToDate: 0,
                months: [],
            };
        }
        
        const interestPaid = balance * monthlyRate;
        const principalPaid = emi - interestPaid;
        balance -= principalPaid;

        if (i === tenureMonths - 1 && Math.abs(balance) < 1) {
            balance = 0;
        }

        const loanPaidToDate = ((principal - balance) / principal) * 100;

        const monthData: MonthlyAmortization = {
            month: month,
            emi: emi,
            interestPaid: interestPaid,
            principalPaid: principalPaid,
            balance: balance,
            loanPaidToDate: loanPaidToDate,
        };

        schedule[year].months.push(monthData);
        schedule[year].principalPaid += principalPaid;
        schedule[year].interestPaid += interestPaid;
        schedule[year].totalPayment += emi;
        schedule[year].balance = balance;
        schedule[year].loanPaidToDate = loanPaidToDate;
    }

    return Object.values(schedule);
};


export const calculatePrepayment = (
  principal: number,
  annualRate: number,
  tenureYears: number,
  monthlyPrepayment: number
) => {
  if (principal <= 0) return {
    interestSaved: 0,
    tenureReducedMonths: 0,
    newTenureYears: tenureYears,
    amortizationData: [],
  };

  const monthlyRate = annualRate / 12 / 100;
  const originalEMI = calculateEMI(principal, annualRate, tenureYears);
  const originalMonths = tenureYears * 12;
  const originalTotalPayment = originalEMI * originalMonths;

  let balance = principal;
  let months = 0;
  let totalInterestPaid = 0;

  const amortizationData = [];
  let currentYear = 0;
  let lastYearBalance = principal;

  // With prepayment
  while (balance > 0) {
    const interest = balance * monthlyRate;
    let principalPaid = originalEMI - interest;
    balance -= principalPaid;
    balance -= monthlyPrepayment;
    totalInterestPaid += interest;
    months++;
    
    if (months % 12 === 0 || balance <= 0) {
        currentYear++;
        amortizationData.push({ 
            year: currentYear, 
            withPrepayment: Math.max(0, balance),
            withoutPrepayment: 0 // placeholder
        });
    }
  }

  const newTotalPayment = principal + totalInterestPaid;
  const interestSaved = originalTotalPayment - newTotalPayment;
  const tenureReducedMonths = originalMonths - months;
  const newTenureYears = parseFloat((months / 12).toFixed(1));

  // Without prepayment for chart
  let balanceWithout = principal;
  for (let i = 0; i < amortizationData.length; i++) {
    for (let j=0; j<12; j++) {
        const interest = balanceWithout * monthlyRate;
        balanceWithout -= (originalEMI - interest);
    }
    amortizationData[i].withoutPrepayment = Math.max(0, balanceWithout);
  }


  return { interestSaved, tenureReducedMonths, newTenureYears, amortizationData };
};
