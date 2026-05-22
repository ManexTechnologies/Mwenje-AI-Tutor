interface SubjectCardProps {
  subject: string
}

export function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <div className="rounded-[28px] border border-[rgba(28,25,23,0.08)] bg-white p-5 text-text-primary shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {subject}
    </div>
  )
}
