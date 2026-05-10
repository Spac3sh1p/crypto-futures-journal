interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-bg-secondary border border-border rounded-lg p-5 ${className}`}
    >
      {children}
    </div>
  );
}
