import { CalculationInput, CalculationResult, SafetySignal } from "@/types";

export function computeMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (termMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const numerator = principal * monthlyRate;
  const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);
  return numerator / denominator;
}

export function computePrincipalFromPayment(
  monthlyPayment: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (termMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return monthlyPayment * termMonths;
  const factor = (1 - Math.pow(1 + monthlyRate, -termMonths)) / monthlyRate;
  return monthlyPayment * factor;
}

export function getSafetySignal(dsrPercent: number): SafetySignal {
  if (dsrPercent <= 30) return "safe";
  if (dsrPercent <= 40) return "caution";
  return "risk";
}

export function evaluateLoanScenario(input: CalculationInput): CalculationResult {
  const {
    monthlyIncome,
    existingDebtBalance, // currently not used in computation; reserved for future constraints (e.g., LTV/DTI)
    existingMonthlyPayment,
    desiredLoanAmount,
    desiredLoanTermMonths,
    interestRatePercent,
    dsrLimitPercent,
    loanType,
    collateralValue,
    ltvLimitPercent,
    rateMode,
    stepMonth,
    ratePercentAfter
  } = input;

  const monthlyPaymentFirst = computeMonthlyPayment(
    desiredLoanAmount,
    interestRatePercent,
    desiredLoanTermMonths
  );

  const allowedTotalDebtService = (monthlyIncome * dsrLimitPercent) / 100;
  const allowedForNewLoan = Math.max(0, allowedTotalDebtService - existingMonthlyPayment);
  const maxLoanByDSR = computePrincipalFromPayment(
    allowedForNewLoan,
    interestRatePercent,
    desiredLoanTermMonths
  );

  // LTV constraint (mortgage only). If inputs are missing, treat as Infinity.
  let maxLoanByLTV: number | undefined = undefined;
  if (loanType === "mortgage") {
    if (collateralValue && collateralValue > 0) {
      const ltv = Math.min(Math.max(ltvLimitPercent ?? 70, 1), 100);
      maxLoanByLTV = Math.floor((collateralValue * ltv) / 100);
    } else {
      maxLoanByLTV = undefined;
    }
  }

  const maxLoanAllowed = Math.floor(
    Math.min(
      maxLoanByDSR,
      maxLoanByLTV != null ? maxLoanByLTV : Number.POSITIVE_INFINITY
    )
  );

  const dsrAfterPercent =
    monthlyIncome > 0
      ? ((existingMonthlyPayment + monthlyPaymentFirst) / monthlyIncome) * 100
      : 0;

  const signal = getSafetySignal(dsrAfterPercent);

  // Amortization totals for requested loan amount; supports two-step variable rate by re-amortization at stepMonth
  let remaining = desiredLoanAmount;
  let totalInterest = 0;
  let currentPayment = monthlyPaymentFirst;
  let currentRate = interestRatePercent;
  let monthlyPaymentAfterStep: number | undefined = undefined;
  for (let i = 1; i <= desiredLoanTermMonths; i++) {
    if (rateMode === "twoStep" && stepMonth && ratePercentAfter != null && i === stepMonth + 1) {
      currentRate = ratePercentAfter;
      const remainingTerm = Math.max(1, desiredLoanTermMonths - stepMonth);
      currentPayment = computeMonthlyPayment(remaining, currentRate, remainingTerm);
      monthlyPaymentAfterStep = currentPayment;
    }
    const rMonthly = currentRate / 100 / 12;
    const interestPortion = remaining * rMonthly;
    const principalPortion = Math.max(0, currentPayment - interestPortion);
    totalInterest += interestPortion;
    remaining = Math.max(0, remaining - principalPortion);
    if (remaining <= 0) break;
  }
  const totalPrincipal = desiredLoanAmount;

  return {
    monthlyPayment: Math.round(monthlyPaymentFirst),
    monthlyPaymentAfterStep: monthlyPaymentAfterStep ? Math.round(monthlyPaymentAfterStep) : undefined,
    maxLoanByDSR: Math.floor(maxLoanByDSR),
    maxLoanByLTV,
    maxLoanAllowed,
    dsrAfterPercent,
    safetySignal: signal,
    totalInterest: Math.round(totalInterest),
    totalPrincipal: Math.round(totalPrincipal),
    explanation: {
      monthlyIncome,
      dsrLimitPercent,
      allowedTotalDebtService: Math.round(allowedTotalDebtService),
      existingMonthlyPayment,
      allowedForNewLoan: Math.round(allowedForNewLoan),
      interestRatePercent,
      desiredLoanTermMonths,
      loanType,
      collateralValue,
      ltvLimitPercent,
      desiredLoanAmount,
      notes:
        "DSR 한도 기반 신규대출 한도를 계산하고, 주담대의 경우 LTV 제약을 함께 고려했습니다."
    }
  };
}


