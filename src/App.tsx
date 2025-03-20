import { useState, useEffect } from "react";
import { InputField } from "./components/InputField";
import type { LoanDetails, AmortizationEntry } from "./types";
import "./App.css";
import { ResultCard } from "./components/ResultCard";
import { AmortizationTable } from "./components/AmortizationTable";

// Style constants
const inputClasses =
  "w-full h-14 text-lg px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500";

const buttonClasses =
  "w-full bg-blue-600 text-white text-lg font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200";

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  if (num === 0) return "";
  if (num < 1000) return `${num}`;
  if (num < 100000) return `${(num / 1000).toFixed(1)} thousand`;
  if (num < 10000000) return `${(num / 100000).toFixed(1)} lakh`;
  return `${(num / 10000000).toFixed(1)} crore`;
};

interface Prepayment {
  id: string;
  amount: number;
  date: string;
}

interface PrepaymentResult {
  prepaymentId: string;
  amount: number;
  date: string;
  savings: number;
  newEMI: number;
  newTenureMonths: number;
}

function App() {
  const [loanDetails, setLoanDetails] = useState<LoanDetails>({
    principal: 0,
    interestRate: 0,
    tenureYears: 0,
    startDate: new Date().toISOString().split("T")[0],
  });

  const [prepayments, setPrepayments] = useState<Prepayment[]>([]);
  const [monthlyEMI, setMonthlyEMI] = useState<number>(0);
  const [results, setResults] = useState<PrepaymentResult[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);

  // Calculate monthly EMI when loan details change
  useEffect(() => {
    if (
      loanDetails.principal > 0 &&
      loanDetails.interestRate > 0 &&
      loanDetails.tenureYears > 0
    ) {
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
    setLoanDetails((prev) => ({
      ...prev,
      [name]: ["principal", "tenureYears"].includes(name)
        ? Math.abs(Number(value))
        : value,
    }));
  };

  const handleAddPrepayment = () => {
    const newPrepayment: Prepayment = {
      id: crypto.randomUUID(),
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    };
    setPrepayments([...prepayments, newPrepayment]);
  };

  const handleRemovePrepayment = (id: string) => {
    setPrepayments(prepayments.filter((p) => p.id !== id));
  };

  const handlePrepaymentChange = (
    id: string,
    field: keyof Prepayment,
    value: string | number
  ) => {
    setPrepayments(
      prepayments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Calculate EMI using the formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const calculateEMI = (
    principal: number,
    annualRate: number,
    months: number
  ): number => {
    const monthlyRate = annualRate / 100 / 12;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };

  const handleCalculate = () => {
    if (!isValidLoanDetails()) return;

    const results: PrepaymentResult[] = [];
    let currentPrincipal = loanDetails.principal;
    let currentEMI = monthlyEMI;
    let currentTenureMonths = loanDetails.tenureYears * 12;
    let totalSavings = 0;

    // Sort prepayments by date
    const sortedPrepayments = [...prepayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedPrepayments.forEach((prepayment) => {
      const prepaymentDate = new Date(prepayment.date);
      const startDate = new Date(loanDetails.startDate);
      const monthsElapsed =
        (prepaymentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (prepaymentDate.getMonth() - startDate.getMonth());

      if (monthsElapsed >= 0 && monthsElapsed < currentTenureMonths) {
        currentPrincipal -= prepayment.amount;
        const newEMI = calculateEMI(
          currentPrincipal,
          loanDetails.interestRate,
          currentTenureMonths - monthsElapsed
        );
        const newTenureMonths = calculateTenureMonths(
          currentPrincipal,
          newEMI,
          loanDetails.interestRate
        );
        const savings =
          currentEMI * currentTenureMonths - newEMI * newTenureMonths;

        results.push({
          prepaymentId: prepayment.id,
          amount: prepayment.amount,
          date: prepayment.date,
          savings,
          newEMI,
          newTenureMonths,
        });

        currentEMI = newEMI;
        currentTenureMonths = newTenureMonths;
        totalSavings += savings;
      }
    });

    setResults(results);
    setTotalSavings(totalSavings);
  };

  const isValidLoanDetails = () => {
    return (
      loanDetails.principal > 0 &&
      loanDetails.interestRate > 0 &&
      loanDetails.tenureYears > 0
    );
  };

  const calculateTenureMonths = (
    principal: number,
    emi: number,
    annualRate: number
  ): number => {
    const monthlyRate = annualRate / 100 / 12;
    const tenureMonths =
      Math.log(emi / (emi - principal * monthlyRate)) /
      Math.log(1 + monthlyRate);
    return Math.round(tenureMonths);
  };

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
    const start = new Date(startDate);

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = emi - interest;
      balance -= principalPaid;
      totalInterest += interest;

      const currentDate = new Date(start);
      currentDate.setMonth(start.getMonth() + month - 1);

      schedule.push({
        month,
        date: currentDate.toISOString().split("T")[0],
        payment: emi,
        principal: principalPaid,
        interest,
        balance: Math.max(0, balance),
        totalInterest,
      });

      if (balance <= 0) break;
    }

    return schedule;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-white mb-12">
          Loan Prepayment Calculator
        </h1>

        <div className="bg-gray-800 rounded-xl p-8 mb-8 shadow-lg border border-gray-700">
          <h2 className="text-2xl font-semibold text-white text-center mb-8 pb-4 border-b border-gray-700">
            Loan Details
          </h2>
          <div className="max-w-xl mx-auto space-y-4">
            <InputField
              id="principal"
              label="Principal Amount"
              type="number"
              value={loanDetails.principal || ""}
              onChange={handleLoanDetailsChange}
              placeholder="Enter loan amount"
              formattedValue={
                loanDetails.principal > 0
                  ? formatCurrency(loanDetails.principal)
                  : undefined
              }
              wordValue={
                loanDetails.principal > 0
                  ? numberToWords(loanDetails.principal)
                  : undefined
              }
            />

            <InputField
              id="interestRate"
              label="Interest Rate (%)"
              type="number"
              value={loanDetails.interestRate || ""}
              onChange={handleLoanDetailsChange}
              placeholder="Enter annual interest rate"
              step="0.01"
            />

            <InputField
              id="tenureYears"
              label="Loan Tenure (years)"
              type="number"
              value={loanDetails.tenureYears || ""}
              onChange={handleLoanDetailsChange}
              placeholder="Enter loan duration in years"
            />

            <InputField
              id="startDate"
              label="Loan Start Date"
              type="date"
              value={loanDetails.startDate}
              onChange={handleLoanDetailsChange}
            />

            <InputField
              id="calculatedEMI"
              label="Monthly EMI (Calculated)"
              type="text"
              value={
                monthlyEMI > 0
                  ? formatCurrency(monthlyEMI)
                  : "Enter loan details"
              }
              onChange={() => {}}
              formattedValue={
                monthlyEMI > 0 ? formatCurrency(monthlyEMI) : undefined
              }
              wordValue={monthlyEMI > 0 ? numberToWords(monthlyEMI) : undefined}
              readOnly={true}
              isCalculated={true}
            />
          </div>
        </div>

        <div className="bg-gray-800 shadow-xl rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            Prepayment Details
          </h2>
          <div className="grid grid-cols-1 gap-y-6">
            {prepayments.map((prepayment) => (
              <div
                key={prepayment.id}
                className="flex flex-col md:flex-row md:items-center"
              >
                <div className="w-full md:w-3/5 flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={prepayment.amount || ""}
                      onChange={(e) =>
                        handlePrepaymentChange(
                          prepayment.id,
                          "amount",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Enter prepayment amount"
                      className={inputClasses}
                    />
                    {prepayment.amount > 0 && (
                      <div className="mt-1 text-sm text-gray-400">
                        {formatCurrency(prepayment.amount)} (
                        {numberToWords(prepayment.amount)})
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={prepayment.date}
                      onChange={(e) =>
                        handlePrepaymentChange(
                          prepayment.id,
                          "date",
                          e.target.value
                        )
                      }
                      className={inputClasses}
                    />
                  </div>
                  <button
                    onClick={() => handleRemovePrepayment(prepayment.id)}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddPrepayment}
              className="w-full bg-green-600 text-white text-lg font-semibold py-4 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200"
            >
              Add Prepayment
            </button>
          </div>
        </div>

        <button onClick={handleCalculate} className={buttonClasses}>
          Calculate Prepayment Benefits
        </button>

        {results.length > 0 && (
          <div className="mt-8 bg-gray-800 shadow-xl rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-8 text-center">
              Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ResultCard
                title="Total Savings"
                value={formatCurrency(totalSavings)}
                valueColor="text-green-400"
              />
              <ResultCard
                title="Final EMI"
                value={formatCurrency(results[results.length - 1].newEMI)}
                valueColor="text-blue-400"
              />
              <ResultCard
                title="Loan Tenure Reduction"
                value={`${Math.floor(
                  (loanDetails.tenureYears * 12 -
                    results[results.length - 1].newTenureMonths) /
                    12
                )} years, ${
                  (loanDetails.tenureYears * 12 -
                    results[results.length - 1].newTenureMonths) %
                  12
                } months`}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-700">
                Prepayment Impact Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Prepayment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Savings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        New EMI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        New Tenure
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {results.map((result) => (
                      <tr
                        key={result.prepaymentId}
                        className="hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(result.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatCurrency(result.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                          {formatCurrency(result.savings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                          {formatCurrency(result.newEMI)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {result.newTenureMonths} months
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-700">
                Amortization Schedule
              </h3>
              <div className="overflow-x-auto bg-gray-900 rounded-xl p-4 shadow-inner">
                <AmortizationTable
                  data={calculateAmortization(
                    loanDetails.principal,
                    loanDetails.interestRate,
                    loanDetails.tenureYears * 12,
                    monthlyEMI,
                    loanDetails.startDate
                  )}
                  formatCurrency={formatCurrency}
                  prepaymentMonth={
                    results.length > 0
                      ? new Date(results[0].date).getMonth() -
                        new Date(loanDetails.startDate).getMonth() +
                        1
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
