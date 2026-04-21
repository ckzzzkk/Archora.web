interface BlueprintCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function BlueprintCard({ children, className = '' }: BlueprintCardProps) {
  return (
    <div
      className={`border border-sketch rounded-card bg-surface p-8 group hover:bg-elevated transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}
