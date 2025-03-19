import { describe, expect, test } from 'vitest'

interface AmortizationEntry {
  month: number
  payment: number
  principal: number
  interest: number
  remainingBalance: number
}

interface Prepayment {
  amount: number
  month: number
}

function calculateAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  prepayments: Prepayment[] = []
): AmortizationEntry[] {
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

describe('Loan Calculator', () => {
  test('calculates basic loan without prepayments correctly', () => {
    const principal = 1000000 // 10 lakh rupees
    const annualRate = 0.08 // 8%
    const monthlyRate = annualRate / 12
    const years = 20
    const totalMonths = years * 12

    const schedule = calculateAmortizationSchedule(
      principal,
      monthlyRate,
      totalMonths,
      []
    )

    // Check first payment
    const firstPayment = schedule[0]
    expect(firstPayment.month).toBe(1)
    expect(firstPayment.payment).toBeGreaterThan(8300)
    expect(firstPayment.payment).toBeLessThan(8400)
    expect(firstPayment.interest).toBeCloseTo(6666.67, 0)
    expect(firstPayment.principal).toBeGreaterThan(1600)
    expect(firstPayment.principal).toBeLessThan(1800)
    expect(firstPayment.remainingBalance).toBeGreaterThan(998000)
    expect(firstPayment.remainingBalance).toBeLessThan(999000)

    // Check total payments
    const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0)
    expect(totalPayment).toBeGreaterThan(2007000)
    expect(totalPayment).toBeLessThan(2008000)

    // Check loan is fully paid
    const lastPayment = schedule[schedule.length - 1]
    expect(lastPayment.remainingBalance).toBeLessThan(1)
  })

  test('calculates loan with single prepayment correctly', () => {
    const principal = 1000000 // 10 lakh rupees
    const annualRate = 0.08 // 8%
    const monthlyRate = annualRate / 12
    const years = 20
    const totalMonths = years * 12
    const prepayments = [{ amount: 100000, month: 12 }] // 1 lakh prepayment in month 12

    const schedule = calculateAmortizationSchedule(
      principal,
      monthlyRate,
      totalMonths,
      prepayments
    )

    // Check prepayment month
    const prepaymentMonth = schedule[11] // month 12 is at index 11
    expect(prepaymentMonth.payment).toBeGreaterThan(108300)
    expect(prepaymentMonth.payment).toBeLessThan(108400)

    // Check loan completes earlier
    expect(schedule.length).toBeLessThan(totalMonths)

    // Check loan is fully paid
    const lastPayment = schedule[schedule.length - 1]
    expect(lastPayment.remainingBalance).toBeLessThan(1)
  })

  test('calculates loan with multiple prepayments correctly', () => {
    const principal = 1000000 // 10 lakh rupees
    const annualRate = 0.08 // 8%
    const monthlyRate = annualRate / 12
    const years = 20
    const totalMonths = years * 12
    const prepayments = [
      { amount: 50000, month: 12 }, // 50k in month 12
      { amount: 50000, month: 24 }, // 50k in month 24
    ]

    const schedule = calculateAmortizationSchedule(
      principal,
      monthlyRate,
      totalMonths,
      prepayments
    )

    // Check first prepayment month
    const firstPrepaymentMonth = schedule[11]
    expect(firstPrepaymentMonth.payment).toBeGreaterThan(58300)
    expect(firstPrepaymentMonth.payment).toBeLessThan(58400)

    // Check second prepayment month
    const secondPrepaymentMonth = schedule[23]
    expect(secondPrepaymentMonth.payment).toBeGreaterThan(58300)
    expect(secondPrepaymentMonth.payment).toBeLessThan(58400)

    // Check loan completes earlier than original term
    expect(schedule.length).toBeLessThan(totalMonths)

    // Check loan is fully paid
    const lastPayment = schedule[schedule.length - 1]
    expect(lastPayment.remainingBalance).toBeLessThan(1)
  })

  test('handles edge cases correctly', () => {
    const principal = 100000
    const monthlyRate = 0.01
    const totalMonths = 12

    // Test with prepayment larger than remaining balance
    const largePrepayment = [{ amount: 95000, month: 2 }]
    const schedule = calculateAmortizationSchedule(
      principal,
      monthlyRate,
      totalMonths,
      largePrepayment
    )

    // Should end early
    expect(schedule.length).toBeLessThan(totalMonths)
    // Last payment should be adjusted
    expect(schedule[schedule.length - 1].remainingBalance).toBeLessThan(1)
  })
}) 