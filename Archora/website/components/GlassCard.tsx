interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  prominent?: boolean;
}

export default function GlassCard({ children, className = '', prominent = false }: GlassCardProps) {
  return (
    <div
      className={`${prominent ? 'glass-prominent' : 'glass'} rounded-card ${className}`}
    >
      {children}
    </div>
  );
}
