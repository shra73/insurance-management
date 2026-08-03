const COLOR_MAP = {
  green: "bg-success-100 text-success-700",
  amber: "bg-warning-100 text-warning-700",
  red: "bg-danger-100 text-danger-700",
  blue: "bg-info-100 text-info-700",
  primary: "bg-primary-100 text-primary-700",
  gray: "bg-slate-100 text-slate-600"
};

export default function Badge({ color = "gray", children }) {
  return <span className={`badge ${COLOR_MAP[color] || COLOR_MAP.gray}`}>{children}</span>;
}