import { useState } from 'react'
import './App.css'

interface LoanResults {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortizationSchedule: AmortizationEntry[];
}

interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

interface Prepayment {
  amount: number;
  month: number;
}

function App() {
  const [loanAmount, setLoanAmount] = useState<string>('')
  const [interestRate, setInterestRate] = useState<string>('')
  const [loanTerm, setLoanTerm] = useState<string>('')
  const [results, setResults] = useState<LoanResults | null>(null)
  const [prepayments, setPrepayments] = useState<Prepayment[]>([])
  const [newPrepayment, setNewPrepayment] = useState<Prepayment>({
    amount: 0,
    month: 1,
  })

  const calculateAmortizationSchedule = (
    principal: number,
    monthlyRate: number,
    totalMonths: number,
    prepayments: Prepayment[]
  ): AmortizationEntry[] => {
    const schedule: AmortizationEntry[] = []
    let remainingBalance = principal
    let monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)

    for (let month = 1; month <= totalMonths && remainingBalance > 0; month++) {
      const interest = remainingBalance * monthlyRate
      let principalPart = monthlyPayment - interest

      // Apply prepayment if exists for this month
      const prepayment = prepayments.find((p) => p.month === month)
      if (prepayment) {
        principalPart += prepayment.amount
      }

      // Adjust for final payment
      if (principalPart > remainingBalance) {
        principalPart = remainingBalance
        monthlyPayment = principalPart + interest
      }

      remainingBalance -= principalPart

      schedule.push({
        month,
        payment: monthlyPayment + (prepayment?.amount || 0),
        principal: principalPart,
        interest,
        remainingBalance,
      })

      if (remainingBalance <= 0) break
    }

    return schedule
  }

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount)
    const rate = parseFloat(interestRate) / 100 / 12 // Monthly interest rate
    const numberOfPayments = parseFloat(loanTerm) * 12 // Total number of payments

    if (principal > 0 && rate > 0 && numberOfPayments > 0) {
      const schedule = calculateAmortizationSchedule(
        principal,
        rate,
        numberOfPayments,
        prepayments
      )

      const totalPayment = schedule.reduce(
        (sum, entry) => sum + entry.payment,
        0
      )
      const totalInterest = schedule.reduce(
        (sum, entry) => sum + entry.interest,
        0
      )

      setResults({
        monthlyPayment: schedule[0].payment,
        totalPayment,
        totalInterest,
        amortizationSchedule: schedule,
      })
    }
  }

  const addPrepayment = () => {
    if (newPrepayment.amount > 0 && newPrepayment.month > 0) {
      setPrepayments([...prepayments, newPrepayment])
      setNewPrepayment({ amount: 0, month: 1 })
      calculateLoan() // Recalculate with new prepayment
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Loan Calculator with Prepayment
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (₹)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter loan amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter interest rate"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Years)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter loan term"
              />
            </div>
          </div>

          <button
            onClick={calculateLoan}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Calculate
          </button>

          {results && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">
                    Monthly Payment
                  </h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(results.monthlyPayment)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Payment
                  </h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(results.totalPayment)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Interest
                  </h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(results.totalInterest)}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Add Prepayment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={newPrepayment.amount}
                      onChange={(e) =>
                        setNewPrepayment({
                          ...newPrepayment,
                          amount: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter prepayment amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <input
                      type="number"
                      value={newPrepayment.month}
                      onChange={(e) =>
                        setNewPrepayment({
                          ...newPrepayment,
                          month: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter month number"
                      min="1"
                    />
                  </div>
                </div>
                <button
                  onClick={addPrepayment}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Prepayment
                </button>

                {prepayments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">
                      Scheduled Prepayments
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {prepayments.map((prepayment, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center mb-2"
                        >
                          <span>
                            Month {prepayment.month}:{' '}
                            {formatCurrency(prepayment.amount)}
                          </span>
                          <button
                            onClick={() => {
                              setPrepayments(
                                prepayments.filter((_, i) => i !== index)
                              )
                              calculateLoan()
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {results.amortizationSchedule.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">
                    Amortization Schedule
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Month
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Principal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Interest
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.amortizationSchedule.map((entry) => (
                          <tr key={entry.month}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.month}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(entry.payment)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(entry.principal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(entry.interest)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatCurrency(entry.remainingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
