interface FeatureSectionProps {
  title: string;
  description: string;
  highlights: string[];
  reversed?: boolean;
  children?: React.ReactNode;
}

export default function FeatureSection({
  title,
  description,
  highlights,
  reversed = false,
  children,
}: FeatureSectionProps) {
  return (
    <section className="py-24 px-6">
      <div
        className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${
          reversed ? 'lg:direction-rtl' : ''
        }`}
        style={reversed ? { direction: 'rtl' } : undefined}
      >
        {/* Text content */}
        <div style={{ direction: 'ltr' }}>
          <h2 className="font-heading text-3xl md:text-4xl text-text mb-6">
            {title}
          </h2>
          <p className="text-text-secondary font-body text-lg leading-relaxed mb-8">
            {description}
          </p>
          <ul className="space-y-4">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-text-secondary font-body"
              >
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual slot */}
        <div
          className="flex items-center justify-center"
          style={{ direction: 'ltr' }}
        >
          {children ?? (
            <div className="w-full aspect-[4/3] border border-sketch rounded-card bg-surface flex items-center justify-center">
              <svg
                className="w-24 h-24 text-primary/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
