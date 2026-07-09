import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Users2, Activity } from "lucide-react";
import {
  buildGrowthSeries, buildStageSnapshot, buildPerformanceDistribution,
} from "../utils/workforceHelpers";

function ChartCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} className="text-[#2385cd]" />
        <p className="font-semibold text-sm text-gray-900">{title}</p>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}

export default function AnalyticsTab({ records }) {
  const growth      = buildGrowthSeries(records);
  const snapshot     = buildStageSnapshot(records);
  const performance  = buildPerformanceDistribution(records);
  const totalStaff   = snapshot.find((s) => s.status === "Confirmed Staff")?.count ?? 0;
  const totalPipeline = snapshot.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total in pipeline", value: totalPipeline, bg: "bg-white",     color: "text-gray-900"  },
          { label: "Confirmed staff",   value: totalStaff,    bg: "bg-[#eaf4fc]", color: "text-[#2385cd]" },
          { label: "In training",       value: snapshot.find((s) => s.status === "Candidate")?.count ?? 0, bg: "bg-yellow-50", color: "text-yellow-600" },
          { label: "On probation",      value: snapshot.find((s) => s.status === "Probation")?.count ?? 0, bg: "bg-orange-50", color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-[#b8d9f0]/40`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <ChartCard icon={TrendingUp} title="Organization growth" subtitle="Cumulative confirmed staff over time — the clearest single signal of whether the organization is growing.">
        {growth.length < 2 ? (
          <div className="h-52 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded-lg">
            Not enough confirmations yet to chart growth over time.
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf4fc" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #b8d9f0" }} />
                <Line type="monotone" dataKey="confirmedStaff" name="Confirmed staff" stroke="#2385cd" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={Users2} title="Pipeline snapshot" subtitle="How many people sit at each stage right now.">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf4fc" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #b8d9f0" }} />
                <Bar dataKey="count" fill="#2385cd" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard icon={Activity} title="Performance distribution" subtitle="Confirmed staff grouped by performance indicator (based on removal history).">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaf4fc" />
                <XAxis dataKey="indicator" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #b8d9f0" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {performance.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}