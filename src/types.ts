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

export type {
  LoanDetails,
  PrepaymentDetails,
  AmortizationEntry,
  CalculationResult,
  Prepayment,
  PrepaymentResult,
};
