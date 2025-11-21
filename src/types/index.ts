export type SafetySignal = "safe" | "caution" | "risk";

export interface CalculationInput {
  monthlyIncome: number;
  existingDebtBalance: number;
  existingMonthlyPayment: number;
  desiredLoanAmount: number;
  desiredLoanTermMonths: number;
  interestRatePercent: number;
  dsrLimitPercent: number;
  loanType: "unsecured" | "mortgage";
  collateralValue?: number;
  ltvLimitPercent?: number;
  rateMode: "fixed" | "twoStep";
  stepMonth?: number;
  ratePercentAfter?: number;
}

export interface CalculationResult {
  monthlyPayment: number;
  monthlyPaymentAfterStep?: number;
  maxLoanByDSR: number;
  maxLoanByLTV?: number;
  maxLoanAllowed: number;
  dsrAfterPercent: number;
  safetySignal: SafetySignal;
  totalInterest: number;
  totalPrincipal: number;
  explanation: {
    monthlyIncome: number;
    dsrLimitPercent: number;
    allowedTotalDebtService: number;
    existingMonthlyPayment: number;
    allowedForNewLoan: number;
    interestRatePercent: number;
    desiredLoanTermMonths: number;
    loanType: "unsecured" | "mortgage";
    collateralValue?: number;
    ltvLimitPercent?: number;
    desiredLoanAmount: number;
    notes: string;
  };
}


