/**
 * The ASORIA mark: an "A" drawn like a drafting figure, with a compass rose at its apex. It follows the text colour,
 * and the compass centre is the one magenta dot, like the app's single primary action.
 */
export default function Mark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="ASORIA"
      className={className}
    >
      <path
        d="M14 36 L20 7 L26 36 M16.4 26 H23.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="13" r="6.2" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M20 8 V18 M15 13 H25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <circle cx="20" cy="13" r="1.9" fill="rgb(var(--action))" />
    </svg>
  );
}
