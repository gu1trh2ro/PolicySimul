"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);
  return (
    <div className="card">
      <h2>문제가 발생했습니다.</h2>
      <p className="notes">잠시 후 다시 시도해주세요.</p>
      <button type="button" onClick={reset}>다시 시도</button>
    </div>
  );
}






