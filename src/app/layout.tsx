export const metadata = {
  title: "PolicySimul",
  description: "정책 변화에 따른 대출 영향 시뮬레이터"
};

import "./globals.css";
import { ReactNode } from "react";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProviderWrapper>
          <div className="container">
            <header className="header">
              <h1>PolicySimul</h1>
              <p className="subtitle">정책 변화가 내 대출에 주는 영향, 즉시 비교</p>
            </header>
            <main>{children}</main>
            <footer className="footer">© {new Date().getFullYear()} PolicySimul</footer>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}


