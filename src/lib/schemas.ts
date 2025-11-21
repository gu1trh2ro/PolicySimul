import { z } from "zod";

const CalculationInputBaseSchema = z.object({
  monthlyIncome: z.number().min(0).max(10_000_000_000),
  existingDebtBalance: z.number().min(0).max(10_000_000_000),
  existingMonthlyPayment: z.number().min(0).max(10_000_000_000),
  desiredLoanAmount: z.number().min(0).max(10_000_000_000),
  desiredLoanTermMonths: z.number().int().min(1).max(1200),
  interestRatePercent: z.number().min(0).max(50),
  dsrLimitPercent: z.number().min(1).max(100),
  loanType: z.enum(["unsecured", "mortgage"]).default("unsecured"),
  collateralValue: z.number().min(0).max(10_000_000_000).optional(),
  ltvLimitPercent: z.number().min(1).max(100).optional(),
  rateMode: z.enum(["fixed", "twoStep"]).default("fixed"),
  stepMonth: z.number().int().min(1).max(1200).optional(),
  ratePercentAfter: z.number().min(0).max(50).optional()
});

export const CalculationInputSchema = CalculationInputBaseSchema
  .superRefine((v, ctx) => {
    if (!(v.monthlyIncome > 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "월 소득은 0보다 커야 합니다.", path: ["monthlyIncome"] });
    }
    if (v.rateMode === "twoStep") {
      if (v.stepMonth == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "변동 시점을 입력하세요.", path: ["stepMonth"] });
      } else if (v.stepMonth >= v.desiredLoanTermMonths) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "변동 시점은 전체 기간보다 짧아야 합니다.", path: ["stepMonth"] });
      }
      if (v.ratePercentAfter == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "변동 후 금리를 입력하세요.", path: ["ratePercentAfter"] });
      }
    }
  });

export const PolicyParamsSchema = CalculationInputBaseSchema.pick({
  interestRatePercent: true,
  dsrLimitPercent: true,
  loanType: true,
  ltvLimitPercent: true,
  rateMode: true,
  stepMonth: true,
  ratePercentAfter: true
}).partial();

export const ScenarioPayloadSchema = z.object({
  before: CalculationInputSchema,
  after: CalculationInputSchema
});

export const ScenarioSaveSchema = z.object({
  name: z.string().min(1).max(100),
  payload: ScenarioPayloadSchema
});

export const PolicyTemplateSaveSchema = z.object({
  name: z.string().min(1).max(100),
  params: PolicyParamsSchema
});

export type CalculationInputDto = z.infer<typeof CalculationInputSchema>;


