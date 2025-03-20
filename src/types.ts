export interface LoanDetails {
  principal: number;
  interestRate: number;
  tenureYears: number;
  startDate: string;
}

export interface PrepaymentDetails {
  amount: number;
  date: string;
}

export interface AmortizationEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

export interface CalculationResult {
  monthlyEMI: number;
  totalPayments: number;
  totalInterest: number;
  originalAmortization: AmortizationEntry[];
  prepaymentAmortization: AmortizationEntry[];
  interestSaved: number;
  tenureReduction: number;
}
