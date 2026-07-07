// The mono machine-voice eyebrow above every heading. The teal tick is drawn by
// the .kicker::before rule in globals.css, so the accent stays token-driven.
export default function Kicker({ children, className = "" }) {
  return <p className={`kicker ${className}`}>{children}</p>;
}
