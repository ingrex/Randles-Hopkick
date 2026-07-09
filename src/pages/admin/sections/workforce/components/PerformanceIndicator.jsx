import { PERFORMANCE_HEX } from "../utils/workforceHelpers";

export default function PerformanceIndicator({ indicator = "green", removalCount = 0 }) {
  const label = { green: "Good standing", yellow: "Watch", red: "At risk" }[indicator] ?? "Good standing";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PERFORMANCE_HEX[indicator] }} />
      {label}
      {removalCount > 0 && <span className="text-gray-400">({removalCount} removal{removalCount > 1 ? "s" : ""})</span>}
    </span>
  );
}