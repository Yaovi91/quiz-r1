import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Curve({ state }) {
  const data = (state.curve || []).map(p => ({
    d: p.d.slice(5), // MM-DD
    rate: Math.round(p.rate * 1000) / 10, // en %
  }));

  if (data.length < 2) {
    return (
      <div className="surface-raised p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)] mb-2">
          Taux de réussite
        </div>
        <div className="text-[13px] text-[var(--color-fg-tertiary)] font-mono">
          Réponds à quelques questions sur 2 jours pour voir la courbe apparaître.
        </div>
      </div>
    );
  }

  return (
    <div className="surface-raised p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-tertiary)]">
          Taux de réussite
        </div>
        <div className="font-mono tabular text-[12px] text-[var(--color-fg-secondary)]">
          {data[data.length - 1].rate.toFixed(1)}%
        </div>
      </div>
      <div className="h-[160px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E63946" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E63946" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="d"
              tick={{ fill: "#5B5F73", fontSize: 10, fontFamily: "Geist Mono" }}
              axisLine={false} tickLine={false} interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#5B5F73", fontSize: 10, fontFamily: "Geist Mono" }}
              axisLine={false} tickLine={false} width={28}
              tickFormatter={v => `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#14161C",
                border: "1px solid #2A2E40",
                borderRadius: 10,
                fontFamily: "Geist Mono",
                fontSize: 12,
              }}
              labelStyle={{ color: "#9095A6" }}
              itemStyle={{ color: "#E63946" }}
              formatter={(v) => [`${v.toFixed(1)}%`, "Taux"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="url(#rateGrad)"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
