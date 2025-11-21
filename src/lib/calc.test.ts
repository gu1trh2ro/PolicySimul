import { describe, it, expect } from "vitest";
import { computeMonthlyPayment, computePrincipalFromPayment, evaluateLoanScenario } from "./calc";

describe("computeMonthlyPayment / computePrincipalFromPayment", () => {
  it("should be near-inverses for typical values", () => {
    const principal = 300_000_000;
    const rate = 4.5;
    const months = 360;
    const pmt = computeMonthlyPayment(principal, rate, months);
    const back = computePrincipalFromPayment(pmt, rate, months);
    expect(Math.abs(back - principal)).toBeLessThan(5000); // within 5k KRW tolerance
  });
});

describe("evaluateLoanScenario", () => {
  it("should compute DSR and limits", () => {
    const input = {
      monthlyIncome: 4_000_000,
      existingDebtBalance: 20_000_000,
      existingMonthlyPayment: 300_000,
      desiredLoanAmount: 300_000_000,
      desiredLoanTermMonths: 360,
      interestRatePercent: 4.0,
      dsrLimitPercent: 40,
      loanType: "unsecured" as const,
      rateMode: "fixed" as const
    };
    const res = evaluateLoanScenario(input);
    expect(res.monthlyPayment).toBeGreaterThan(0);
    expect(res.maxLoanByDSR).toBeGreaterThan(0);
    expect(res.maxLoanAllowed).toBeGreaterThan(0);
    expect(res.dsrAfterPercent).toBeGreaterThan(0);
  });
});






