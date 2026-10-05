export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="BiOrion">
      <path d="M16 2l11 4v8c0 7-4.8 13-11 15C9.8 27 5 21 5 14V6l11-4z" stroke="#22d3ee" strokeWidth="1.8" fill="rgba(34,211,238,0.07)" />
      <rect x="10.5" y="11.5" width="11" height="8" rx="1.5" stroke="#e2e8f0" strokeWidth="1.5" />
      <circle cx="16" cy="15.5" r="2.1" stroke="#22d3ee" strokeWidth="1.5" />
      <path d="M13 24h6" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
