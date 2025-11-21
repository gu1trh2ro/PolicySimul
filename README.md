# PolicySimul

정책 변화가 개인의 대출 가능금액과 월 상환 부담에 미치는 영향을 즉시 비교하는 웹앱.

## 빠른 시작

1) 의존성 설치

```bash
npm i
```

2) DB 준비 (Prisma + SQLite)

```bash
npx prisma init --datasource-provider sqlite
echo DATABASE_URL="file:./dev.db" > .env
npx prisma migrate dev --name init
```

3) 개발 서버 실행

```bash
npm run dev
```

4) 브라우저에서 열기: `http://localhost:3000`

## OAuth 로그인(선택)

GitHub OAuth를 사용하려면 `.env`에 아래 값을 추가하세요:

```
NEXTAUTH_SECRET=replace-with-random-string
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
```

게스트 세션 쿠키와 병행 사용 가능하며, 로그인 후 자동으로 게스트 소유 데이터가 계정으로 마이그레이션 됩니다.

## 기술 스택
- Next.js (App Router) + React + TypeScript
- API Route로 단일 레포 내 프론트/백엔드 통합
- 입력 검증: zod (서버 우선)

## API
- POST `/api/calculate`
### Auth & Scenarios
- POST `/api/auth/guest` (body: `{ nickname? }`) → 게스트 세션 발급(cookie)
- GET `/api/scenarios` → 내 시나리오 목록(로그인 필요)
- POST `/api/scenarios` (body: `{ name, payload }`) → 저장
- GET/PUT/DELETE `/api/scenarios/:id` (내 소유만)
- POST `/api/scenarios/:id/share` (body: `{ enable: boolean }`) → 공유 토글, 링크 반환
- GET `/api/share/:shareId` → 공유 링크로 열람

### Share Viewer (UI)
- 페이지: `/share/[shareId]` → 공유된 시나리오를 불러와 “시뮬레이터에서 열기”/“링크 복사” 제공
  - body
    - `monthlyIncome` (number, >0)
    - `existingDebtBalance` (number, >=0)
    - `existingMonthlyPayment` (number, >=0)
    - `desiredLoanAmount` (number, >=0)
    - `desiredLoanTermMonths` (int, 1~1200)
    - `interestRatePercent` (number, 0~50)
    - `dsrLimitPercent` (number, 1~100)
  - response
    - `monthlyPayment`, `maxLoanByDSR`, `dsrAfterPercent`, `safetySignal`, `explanation`

## 보안/품질
- 서버측 zod 스키마로 범위/형식 검증 및 에러 메시지 반환
- XSS 공격면이 될 수 있는 텍스트 필드는 현재 없음(추후 메모/설명 추가 시 sanitize + CSP)
- 입력 값은 숫자형만 허용, 클라이언트는 편의용이고 서버 검증이 기준
- 시나리오 권한: JWT 서명 쿠키(게스트) 기반 owner 검증, 본인만 조회/수정
- API 레이트 리밋(분당 60/IP), 보안 헤더(CSP 등) 적용

## 테스트

```bash
npm run test
```

단위 테스트: `src/lib/calc.test.ts` (Vitest)

## 시드 데이터

```bash
echo DATABASE_URL="file:./dev.db" > .env
npx prisma migrate dev --name init
npm run db:seed
```

정책 템플릿(완화/강화) 예시가 공개 템플릿으로 생성됩니다.

## 향후 확장 계획
- 로그인/시나리오 저장(NextAuth + DB)
- 전/후 비교 그래프 추가(Bar/Line)
- 정책 템플릿 프리셋 및 공유 링크
- 금리 곡선/변동금리 모델


