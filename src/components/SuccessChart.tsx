import { Text } from "./Text";
import { CHART_DATA, type ChartDatum } from "../fixtures/dashboard";

export interface SuccessChartProps {
  data?: ChartDatum[];
}

export default function SuccessChart({ data = CHART_DATA }: SuccessChartProps) {
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64 }}
    >
      {data.map((d) => (
        <div
          key={d.month}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${d.rate * 0.64}px`,
              background: "var(--accent-transparent)",
              border: "1px solid var(--accent)",
              borderRadius: 3,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: `${d.rate}%`,
                background: "var(--accent)",
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
          </div>
          <Text
            role="caption"
            as="span"
            style={{ color: "var(--muted)", fontSize: 10 }}
          >
            {d.month}
          </Text>
        </div>
      ))}
    </div>
  );
}
