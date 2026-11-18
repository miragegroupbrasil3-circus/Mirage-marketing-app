export function Moldura({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 72" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="47" height="71" fill="#000" stroke="rgba(231,200,122,0.4)" />
      <ellipse cx="24" cy="36" rx="13" ry="20" fill="none" stroke="#E7C87A" strokeWidth="0.7" />
    </svg>
  );
}
