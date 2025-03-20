import { useState, useEffect } from 'react'
import './App.css'

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value === 0) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  if (num === 0) return '';
  if (num < 1000) return `${num}`;
  if (num < 100000) return `${(num/1000).toFixed(1)} thousand`;
  if (num < 10000000) return `${(num/100000).toFixed(1)} lakh`;
  return `${(num/10000000).toFixed(1)} crore`;
};

interface LoanDetails {
  principal: number;
  interestRate: number;
  tenureYears: number;
  startDate: string;
}

interface PrepaymentDetails {
  amount: number;
  date: string;
}

interface AmortizationEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

interface CalculationResult {
  monthlyEMI: number;
  totalPayments: number;
  totalInterest: number;
  originalAmortization: AmortizationEntry[];
  prepaymentAmortization: AmortizationEntry[];
  interestSaved: number;
  tenureReduction: number;
}

function App() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    principal: 0,
    interestRate: 0,
    tenureYears: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const [prepaymentDetails, setPrepaymentDetails] = useState<PrepaymentDetails>({
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [monthlyEMI, setMonthlyEMI] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Calculate monthly EMI when loan details change
  useEffect(() => {
    if (loanDetails.principal > 0 && loanDetails.interestRate > 0 && loanDetails.tenureYears > 0) {
      const emi = calculateEMI(
        loanDetails.principal,
        loanDetails.interestRate,
        loanDetails.tenureYears * 12
      );
      setMonthlyEMI(emi);
    } else {
      setMonthlyEMI(0);
    }
  }, [loanDetails]);

  const handleLoanDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanDetails(prev => ({
      ...prev,
      [name]: ['principal', 'tenureYears'].includes(name) ? Math.abs(Number(value)) : value
    }));
    setShowResults(false);
  };

  const handlePrepaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrepaymentDetails(prev => ({
      ...prev,
      [name]: name === 'amount' ? Math.abs(Number(value)) : value
    }));
    setShowResults(false);
  };

  // Calculate EMI using the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const calculateEMI = (principal: number, annualRate: number, months: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  // Get date after adding months to a given date
  const getDateAfterMonths = (startDate: string, months: number): string => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  // Calculate amortization schedule without prepayment
  const calculateAmortization = (
    principal: number, 
    annualRate: number, 
    months: number, 
    emi: number, 
    startDate: string
  ): AmortizationEntry[] => {
    const monthlyRate = annualRate / 100 / 12;
    const schedule: AmortizationEntry[] = [];
    let balance = principal;
    let totalInterest = 0;

    for (let month = 1; month <= months && balance > 0; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = emi - interestPayment;
      
      // Adjust final payment if needed
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      schedule.push({
        month,
        date: getDateAfterMonths(startDate, month - 1),
        payment: principalPayment + interestPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance,
        totalInterest
      });
      
      if (balance <= 0) break;
    }
    
    return schedule;
  };

  // Calculate amortization schedule with prepayment
  const calculateAmortizationWithPrepayment = (
    principal: number,
    annualRate: number,
    months: number,
    emi: number,
    startDate: string,
    prepaymentAmount: number,
    prepaymentDate: string
  ): AmortizationEntry[] => {
    const monthlyRate = annualRate / 100 / 12;
    const schedule: AmortizationEntry[] = [];
    let balance = principal;
    let totalInterest = 0;
    let prepaymentApplied = false;
    let prepaymentMonth = 0;
    
    // Calculate prepayment month
    if (prepaymentDate && prepaymentAmount > 0) {
      const startDateObj = new Date(startDate);
      const prepaymentDateObj = new Date(prepaymentDate);
      const diffMonths = (prepaymentDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + 
        (prepaymentDateObj.getMonth() - startDateObj.getMonth());
      prepaymentMonth = diffMonths + 1; // Convert to 1-based month
    }

    for (let month = 1; month <= months && balance > 0; month++) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = emi - interestPayment;
      
      // Apply prepayment if this is the prepayment month
      if (month === prepaymentMonth && !prepaymentApplied && prepaymentAmount > 0) {
        principalPayment += prepaymentAmount;
        prepaymentApplied = true;
      }
      
      // Adjust final payment if needed
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      
      schedule.push({
        month,
        date: getDateAfterMonths(startDate, month - 1),
        payment: principalPayment + interestPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance,
        totalInterest
      });
      
      if (balance <= 0) break;
    }
    
    return schedule;
  };

  const handleCalculate = () => {
    // Validate inputs
    if (loanDetails.principal <= 0 || loanDetails.interestRate <= 0 || loanDetails.tenureYears <= 0) {
      alert('Please enter valid loan details');
      return;
    }

    // Convert tenure to months
    const tenureMonths = loanDetails.tenureYears * 12;
    
    // Calculate original amortization schedule
    const originalSchedule = calculateAmortization(
      loanDetails.principal,
      loanDetails.interestRate,
      tenureMonths,
      monthlyEMI,
      loanDetails.startDate
    );
    
    // Calculate prepayment amortization schedule
    const prepaymentSchedule = calculateAmortizationWithPrepayment(
      loanDetails.principal,
      loanDetails.interestRate,
      tenureMonths,
      monthlyEMI,
      loanDetails.startDate,
      prepaymentDetails.amount,
      prepaymentDetails.date
    );
    
    // Calculate savings and reductions
    const originalInterest = originalSchedule[originalSchedule.length - 1].totalInterest;
    const prepaymentInterest = prepaymentSchedule[prepaymentSchedule.length - 1].totalInterest;
    const interestSaved = originalInterest - prepaymentInterest;
    const tenureReduction = originalSchedule.length - prepaymentSchedule.length;
    
    setCalculationResult({
      monthlyEMI,
      totalPayments: originalSchedule.length,
      totalInterest: originalInterest,
      originalAmortization: originalSchedule,
      prepaymentAmortization: prepaymentSchedule,
      interestSaved,
      tenureReduction
    });
    
    setShowResults(true);
  };

  // Update with more balanced, reusable styling
  const inputClasses = "w-full h-14 text-lg px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500";
  const readOnlyDisplayClasses = "h-14 text-lg px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white flex items-center";
  const buttonClasses = "w-full bg-blue-600 text-white text-lg font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200";

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-12">Loan Prepayment Calculator</h1>
        
        <div className="bg-gray-800 shadow-xl rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Loan Details</h2>
          <div className="grid grid-cols-1 gap-y-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="principal" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Principal Amount
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="number"
                  id="principal"
                  name="principal"
                  value={loanDetails.principal || ''}
                  onChange={handleLoanDetailsChange}
                  placeholder="Enter amount"
                  className={inputClasses}
                />
                {loanDetails.principal > 0 && (
                  <div className="mt-1 text-sm text-gray-400">
                    {formatCurrency(loanDetails.principal)} ({numberToWords(loanDetails.principal)})
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="interestRate" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Interest Rate (%)
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={loanDetails.interestRate || ''}
                  onChange={handleLoanDetailsChange}
                  placeholder="Enter rate"
                  step="0.01"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="tenureYears" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Loan Tenure (years)
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="number"
                  id="tenureYears"
                  name="tenureYears"
                  value={loanDetails.tenureYears || ''}
                  onChange={handleLoanDetailsChange}
                  placeholder="Enter tenure in years"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="startDate" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Loan Start Date
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={loanDetails.startDate}
                  onChange={handleLoanDetailsChange}
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="calculatedEMI" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Monthly EMI (Calculated)
              </label>
              <div className="w-full md:w-3/5">
                <div 
                  id="calculatedEMI"
                  aria-label="Monthly EMI (Calculated)" 
                  className={readOnlyDisplayClasses}
                >
                  {monthlyEMI > 0 ? formatCurrency(monthlyEMI) : 'Enter loan details'}
                </div>
                {monthlyEMI > 0 && (
                  <div className="mt-1 text-sm text-gray-400">
                    {formatCurrency(monthlyEMI)} ({numberToWords(monthlyEMI)})
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 shadow-xl rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">Prepayment Details</h2>
          <div className="grid grid-cols-1 gap-y-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="prepaymentAmount" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Prepayment Amount
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="number"
                  id="prepaymentAmount"
                  name="amount"
                  value={prepaymentDetails.amount || ''}
                  onChange={handlePrepaymentChange}
                  placeholder="Enter prepayment amount"
                  className={inputClasses}
                />
                {prepaymentDetails.amount > 0 && (
                  <div className="mt-1 text-sm text-gray-400">
                    {formatCurrency(prepaymentDetails.amount)} ({numberToWords(prepaymentDetails.amount)})
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center">
              <label htmlFor="prepaymentDate" className="text-right text-white text-lg font-medium w-full md:w-2/5 mb-2 md:mb-0 md:mr-4">
                Prepayment Date
              </label>
              <div className="w-full md:w-3/5">
                <input
                  type="date"
                  id="prepaymentDate"
                  name="date"
                  value={prepaymentDetails.date}
                  onChange={handlePrepaymentChange}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className={buttonClasses}
        >
          Calculate Prepayment Benefits
        </button>

        {showResults && calculationResult && (
          <div className="bg-gray-800 shadow-xl rounded-lg p-8 mt-8">
            <h2 className="text-2xl font-semibold text-white mb-8 text-center">Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-300 font-medium text-sm">Monthly EMI</h3>
                <p className="text-white text-xl font-bold">{formatCurrency(calculationResult.monthlyEMI)}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-300 font-medium text-sm">Interest Saved</h3>
                <p className="text-green-400 text-xl font-bold">{formatCurrency(calculationResult.interestSaved)}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-gray-300 font-medium text-sm">Loan Tenure Reduction</h3>
                <p className="text-white text-xl font-bold">
                  {Math.floor(calculationResult.tenureReduction / 12)} years, {calculationResult.tenureReduction % 12} months
                </p>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-4">Amortization Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Month</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Principal</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Interest</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {calculationResult.prepaymentAmortization.slice(0, 12).map((entry, index) => (
                    <tr key={index} className={entry.month === 
                      calculationResult.prepaymentAmortization.findIndex(
                        e => e.principal > calculationResult.monthlyEMI
                      ) + 1 ? "bg-blue-900" : ""}>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{entry.month}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{entry.date}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(entry.payment)}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(entry.principal)}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(entry.interest)}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-300">{formatCurrency(entry.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {calculationResult.prepaymentAmortization.length > 12 && (
              <div className="mt-2 text-center">
                <p className="text-gray-400">Showing first 12 months of {calculationResult.prepaymentAmortization.length} months</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
