import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { buildIndividualProgressSeries } from "../../utils/workforceHelpers";

export default function StaffProgressChart({ record }) {
  const data = buildIndividualProgressSeries(record);

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
        Not enough performance history yet to chart a trend.
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eaf4fc" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #b8d9f0" }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="score" name="Performance score" stroke="#2385cd" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}