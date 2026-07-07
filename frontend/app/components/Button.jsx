import Link from "next/link";

// Shared call-to-action. Internal routes use next/link; external links render a
// plain anchor. Two variants: solid accent (primary) and hairline ghost.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition duration-200";
const VARIANTS = {
  primary: "bg-accent text-white hover:brightness-110 active:brightness-95",
  ghost: "border border-hairline-strong bg-surface text-ink hover:border-ink/30 hover:bg-canvas",
};

export default function Button({ href, variant = "primary", external = false, className = "", children }) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
