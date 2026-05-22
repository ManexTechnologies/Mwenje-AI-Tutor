interface FeatureCardProps {
  title: string
  description: string
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-7 shadow-sm">
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mt-3 text-text-secondary">{description}</p>
    </div>
  )
}
