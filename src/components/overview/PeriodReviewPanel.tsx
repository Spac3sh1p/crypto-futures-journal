import type { Dictionary } from "@/lib/i18n";

type PeriodReviewText = Dictionary["overview"]["periodReview"];

const reviewItems = [
  {
    titleKey: "item1Title",
    bodyKey: "item1Body",
    tags: ["confidenceHigh", "opportunity"],
    tone: "green",
    marker: "01",
  },
  {
    titleKey: "item2Title",
    bodyKey: "item2Body",
    tags: ["confidenceMedium", "risk"],
    tone: "yellow",
    marker: "02",
  },
  {
    titleKey: "item3Title",
    bodyKey: "item3Body",
    tags: ["confidenceHigh", "risk"],
    tone: "red",
    marker: "03",
  },
] as const;

function tagClass(tone: "green" | "yellow" | "red", tagKey: string): string {
  if (tagKey === "risk") return "bg-red-dim text-red ring-red/20";
  if (tone === "green") return "bg-green-dim text-green ring-green/20";
  return "bg-yellow-dim text-yellow ring-yellow/20";
}

function markerClass(tone: "green" | "yellow" | "red"): string {
  if (tone === "green") return "border-green/30 bg-green-dim text-green";
  if (tone === "red") return "border-red/30 bg-red-dim text-red";
  return "border-yellow/30 bg-yellow-dim text-yellow";
}

export function PeriodReviewPanel({ text }: { text: PeriodReviewText }) {
  return (
    <section className="trading-panel h-full overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="terminal-section-title">{text.title}</h3>
          <p className="mt-1 text-xs font-medium text-text-muted">{text.subtitle}</p>
        </div>
        <div className="min-w-[5.5rem] rounded-lg border border-yellow/30 bg-bg-tertiary/80 px-3 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-[11px] font-semibold text-text-muted">{text.scoreLabel}</div>
          <div className="font-mono text-xl font-bold leading-tight text-yellow tabular-nums">{text.grade}</div>
        </div>
      </div>

      <div className="space-y-3">
        {reviewItems.map((item) => (
          <div
            key={item.marker}
            className="rounded-lg border border-border-light bg-bg-tertiary/44 px-4 py-3.5 transition-colors hover:bg-bg-hover/44"
          >
            <div className="flex gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold ${markerClass(item.tone)}`}>
                {item.marker}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text-primary">{text[item.titleKey]}</div>
                <p className="mt-1 text-xs leading-5 text-text-muted">{text[item.bodyKey]}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded px-2 py-1 text-[11px] font-semibold ring-1 ${tagClass(item.tone, tag)}`}
                    >
                      {text[tag]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
