import InfoTip from "./InfoTip";

interface LegendChipProps {
  color: string;
  label: string;
  infoTerm?: string;
}

export default function LegendChip({ color, label, infoTerm }: LegendChipProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span style={{
        display: "inline-block", width: 16, height: 16, background: color,
        borderRadius: 3, border: color === "#FFFFFF" ? "1px solid #9CA3AF" : "none",
      }} />
      <span>{label}</span>
      {infoTerm && <InfoTip term={infoTerm} />}
    </span>
  );
}
