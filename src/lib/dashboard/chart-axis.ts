export type PositiveAnchoredDomain = [0 | "dataMin", "dataMax"];

export function getPositiveAnchoredDomain(values: number[]): PositiveAnchoredDomain {
  const finiteValues = values.filter(Number.isFinite);
  const minValue = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const maxValue = finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
  const isTinyNegativeNoise = minValue < 0 && maxValue > 0 && Math.abs(minValue) / maxValue <= 0.01;

  return minValue < 0 && !isTinyNegativeNoise ? ["dataMin", "dataMax"] : [0, "dataMax"];
}
