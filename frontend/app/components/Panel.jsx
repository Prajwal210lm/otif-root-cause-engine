// Base surface card. `reg` adds the forensic registration corner ticks;
// `raised` uses the inset instrument-panel surface; `lift` adds elevation +
// a hover raise for interactive cards. Radius and border stay token-driven.
export default function Panel({
  as: Tag = "div",
  reg = false,
  raised = false,
  lift = false,
  className = "",
  children,
  ...rest
}) {
  const surface = raised ? "bg-raised" : "bg-surface";
  const elevation = lift
    ? "shadow-[var(--shadow-panel)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    : "";
  return (
    <Tag
      className={`relative rounded-xl border border-hairline ${surface} ${reg ? "reg" : ""} ${elevation} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
