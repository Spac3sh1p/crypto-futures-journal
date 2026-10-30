/** 为折线/面积图生成整齐的刻度：步长取 1、2、2.5、5 × 10^n，范围覆盖数据极值。 */
export interface NiceScale {
  domain: [number, number];
  ticks: number[];
}

function niceStep(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

export function buildNiceScale(values: number[], targetTicks = 5, anchorZero = true): NiceScale {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { domain: [0, 1], ticks: [0, 1] };

  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (anchorZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    // 全为 0 时给一段空轴（$0 – $100），避免出现 $0 $0 $1 $1 这种刻度
    max = min + (Math.abs(min) || 100);
  }

  const step = niceStep((max - min) / Math.max(1, targetTicks - 1));
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  return { domain: [niceMin, niceMax], ticks };
}
