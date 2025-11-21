import { prisma } from "@/lib/db";
import ShareApply from "@/components/ShareApply";

export default async function SharePage({ params }: { params: { shareId: string } }) {
  const sc = await prisma.scenario.findFirst({ where: { shareId: params.shareId, isPrivate: false } });
  if (!sc) {
    return (
      <div className="card">
        <h2>공유 시나리오를 찾을 수 없습니다.</h2>
        <p className="notes">링크가 비활성화되었거나 존재하지 않습니다.</p>
      </div>
    );
  }

  const payload = sc.payload as any as { before: any; after: any };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{sc.name}</h2>
      <p className="notes">공유된 시나리오를 시뮬레이터로 불러올 수 있습니다.</p>
      <div style={{ marginTop: 8 }}>
        <ShareApply payload={payload} />
      </div>
      <details className="details" style={{ marginTop: 12 }}>
        <summary>요약 보기</summary>
        <div className="grid two-col gap-sm explanation">
          <div>
            <div className="kv"><span>전 · 금리/기간</span><span>{payload.before.interestRatePercent}% · {payload.before.desiredLoanTermMonths}개월</span></div>
            <div className="kv"><span>전 · 월 소득</span><span>{payload.before.monthlyIncome?.toLocaleString()}원</span></div>
            <div className="kv"><span>전 · DSR 한도</span><span>{payload.before.dsrLimitPercent}%</span></div>
          </div>
          <div>
            <div className="kv"><span>후 · 금리/기간</span><span>{payload.after.interestRatePercent}% · {payload.after.desiredLoanTermMonths}개월</span></div>
            <div className="kv"><span>후 · 월 소득</span><span>{payload.after.monthlyIncome?.toLocaleString()}원</span></div>
            <div className="kv"><span>후 · DSR 한도</span><span>{payload.after.dsrLimitPercent}%</span></div>
          </div>
        </div>
      </details>
    </div>
  );
}






