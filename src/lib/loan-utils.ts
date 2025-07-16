export const calculateEMI = (principal: number, annualRate: number, tenureYears: number): number => {
    if (principal <= 0 || annualRate <= 0 || tenureYears <= 0) return 0;

    const monthlyRate = annualRate / 12 / 100;
    const tenureMonths = tenureYears * 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return emi;
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
