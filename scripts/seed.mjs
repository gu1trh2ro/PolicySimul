import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerId = "public_seed";
  const templates = [
    {
      name: "완화 템플릿",
      params: {
        interestRatePercent: 3.5,
        dsrLimitPercent: 45,
        loanType: "mortgage",
        ltvLimitPercent: 75,
        rateMode: "fixed"
      },
      isPublic: true
    },
    {
      name: "강화 템플릿",
      params: {
        interestRatePercent: 6.0,
        dsrLimitPercent: 30,
        loanType: "unsecured",
        rateMode: "twoStep",
        stepMonth: 24,
        ratePercentAfter: 7.0
      },
      isPublic: true
    }
  ];

  for (const t of templates) {
    await prisma.policyTemplate.create({ data: { ownerId, name: t.name, params: t.params, isPublic: t.isPublic } }).catch(() => {});
  }
}

main().then(() => prisma.$disconnect());


