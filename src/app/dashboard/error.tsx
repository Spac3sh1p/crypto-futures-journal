"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n/LanguageProvider";
import { Panel } from "@/components/ui/Panel";

/** 页面段出错时的兜底：保留侧栏和顶栏，正文位置给出重试按钮，不再是空白或默认错误页 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { dictionary } = useI18n();
  const text = dictionary.common;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Panel className="mx-auto max-w-xl px-6 py-10 text-center">
      <h2 className="text-[15px] font-semibold text-ink">{text.errorTitle}</h2>
      <p className="mt-1 text-[13px] leading-5 text-ink-3">{text.errorHint}</p>
      {error.digest && <p className="ui-num mt-2 text-[12px] text-ink-3">{error.digest}</p>}
      <button type="button" onClick={() => unstable_retry()} className="ui-button ui-button-primary mt-5">
        {text.retry}
      </button>
    </Panel>
  );
}
