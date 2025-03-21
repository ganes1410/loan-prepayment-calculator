import { useState, useEffect } from "react";
import { InputField } from "./components/InputField";
import type {
  LoanDetails,
  AmortizationEntry,
  Prepayment,
  PrepaymentResult,
} from "./types";
import { ResultCard } from "./components/ResultCard";
import { AmortizationTable } from "./components/AmortizationTable";
import { formatCurrency, numberToWords } from "./utils/formatters";

// Style constants
const inputClasses =
  "w-full h-12 text-base px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

const buttonClasses =
  "w-full bg-blue-600 text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 transition-colors duration-200";

const removeButtonClasses =
  "px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-gray-900 transition-colors duration-200";

const readOnlyDisplayClasses = `
  w-full
  h-14
  px-4
  py-4
  bg-gray-700
  text-white
  text-base
  font-semibold
  border
  border-gray-600
  rounded-lg
  flex
  items-center
`;

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

  const calculateTenureMonths = (
    principal: number,
    emi: number,
    annualRate: number
  ): number => {
    const monthlyRate = annualRate / 100 / 12;
    // If EMI is less than monthly interest, loan cannot be repaid
    const monthlyInterest = principal * monthlyRate;
    if (emi <= monthlyInterest) {
      return Infinity;
    }
    const tenureMonths =
      Math.log(emi / (emi - principal * monthlyRate)) /
      Math.log(1 + monthlyRate);
    return Math.ceil(tenureMonths);
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
        // Calculate remaining principal at prepayment date
        const monthlyRate = loanDetails.interestRate / 100 / 12;
        let remainingPrincipal = currentPrincipal;

        // Calculate remaining principal after monthly payments
        for (let i = 0; i < monthsElapsed; i++) {
          const interest = remainingPrincipal * monthlyRate;
          const principalPaid = currentEMI - interest;
          remainingPrincipal -= principalPaid;
        }

        // Apply prepayment
        remainingPrincipal = Math.max(
          0,
          remainingPrincipal - prepayment.amount
        );

        // Calculate new EMI and tenure
        const remainingMonths = currentTenureMonths - monthsElapsed;
        const newEMI = calculateEMI(
          remainingPrincipal,
          loanDetails.interestRate,
          remainingMonths
        );
        const newTenureMonths = calculateTenureMonths(
          remainingPrincipal,
          newEMI,
          loanDetails.interestRate
        );

        // Calculate total payments and savings
        const oldTotalPayment = currentEMI * currentTenureMonths;
        const newTotalPayment =
          currentEMI * monthsElapsed + // Payments made so far
          newEMI * newTenureMonths + // Future payments
          prepayment.amount; // Prepayment amount

        const savings = oldTotalPayment - newTotalPayment;

        results.push({
          prepaymentId: prepayment.id,
          amount: prepayment.amount,
          date: prepayment.date,
          savings,
          newEMI,
          newTenureMonths: newTenureMonths + monthsElapsed,
        });

        currentPrincipal = remainingPrincipal;
        currentEMI = newEMI;
        currentTenureMonths = newTenureMonths + monthsElapsed;
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Loan Prepayment Calculator
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white text-center mb-6 pb-3 border-b border-gray-700">
            Loan Details
          </h2>
          <div className="max-w-xl mx-auto space-y-3">
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

            <div className="mb-6">
              <label
                className="block text-gray-300 text-sm font-medium mb-2"
                id="calculatedEMILabel"
              >
                Monthly EMI (Calculated)
              </label>
              <div className="relative">
                <div
                  aria-labelledby="calculatedEMILabel"
                  aria-readonly="true"
                  className={readOnlyDisplayClasses}
                  role="textbox"
                  data-testid="emi-display"
                >
                  {monthlyEMI ? formatCurrency(monthlyEMI) : ""}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <span className="font-medium">
                    {monthlyEMI ? numberToWords(monthlyEMI) : ""}
                  </span>
                  <span className="ml-1 text-gray-500">
                    ({monthlyEMI ? "per month" : ""})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Prepayment Details
          </h2>
          <div className="grid grid-cols-1 gap-y-4">
            {prepayments.map((prepayment) => (
              <div
                key={prepayment.id}
                className="flex flex-col md:flex-row gap-3"
              >
                <div className="flex-1">
                  <label
                    htmlFor={`prepayment-amount-${prepayment.id}`}
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    Prepayment Amount
                  </label>
                  <input
                    id={`prepayment-amount-${prepayment.id}`}
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
                  <label
                    htmlFor={`prepayment-date-${prepayment.id}`}
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    Prepayment Date
                  </label>
                  <input
                    id={`prepayment-date-${prepayment.id}`}
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
                <div className="flex items-end">
                  <button
                    onClick={() => handleRemovePrepayment(prepayment.id)}
                    className={removeButtonClasses}
                    aria-label="Remove prepayment"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddPrepayment}
              className="w-full bg-green-600/10 text-green-400 text-base font-medium py-3 px-4 rounded-lg hover:bg-green-600/20 focus:outline-none focus:ring-1 focus:ring-green-500 focus:ring-offset-1 focus:ring-offset-gray-900 transition-colors duration-200"
            >
              Add Prepayment
            </button>
          </div>
        </div>

        <button onClick={handleCalculate} className={buttonClasses}>
          Calculate Prepayment Benefits
        </button>

        {results.length > 0 && (
          <div className="mt-6 bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6 text-center">
              Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <ResultCard
                title="Total Savings"
                value={formatCurrency(totalSavings)}
                valueColor="text-green-400"
                dataTestId="total-savings"
              />
              <ResultCard
                title="Final EMI"
                value={formatCurrency(results[results.length - 1].newEMI)}
                valueColor="text-blue-400"
                dataTestId="final-emi"
              />
              <ResultCard
                title="Loan Tenure Reduction"
                value={`${Math.round(
                  loanDetails.tenureYears * 12 -
                    results[results.length - 1].newTenureMonths
                )} months`}
                dataTestId="tenure-reduction"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                Prepayment Impact Details
              </h3>
              <div className="overflow-x-auto">
                <table
                  className="min-w-full divide-y divide-gray-700"
                  role="table"
                >
                  <thead>
                    <tr role="row">
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        Prepayment
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        Date
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        Amount
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        Savings
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        New EMI
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        role="columnheader"
                      >
                        New Tenure
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {results.map((result) => (
                      <tr
                        key={result.prepaymentId}
                        className="hover:bg-gray-700/50"
                        role="row"
                      >
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-white"
                          role="cell"
                        >
                          {formatCurrency(result.amount)}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-white"
                          role="cell"
                        >
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-white"
                          role="cell"
                        >
                          {formatCurrency(result.amount)}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-green-400"
                          role="cell"
                        >
                          {formatCurrency(result.savings)}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-blue-400"
                          role="cell"
                        >
                          {formatCurrency(result.newEMI)}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-white"
                          role="cell"
                        >
                          {result.newTenureMonths} months
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700">
                Amortization Schedule
              </h3>
              <div className="overflow-x-auto bg-gray-900 rounded-lg p-3 shadow-inner">
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
