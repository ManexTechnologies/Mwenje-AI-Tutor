export type SubscriptionPlan = 'free-trial' | 'pro'

const proEmails = new Set(['mamvuraemmmanuel@gmail.com'])

export function getSubscriptionPlan(email?: string | null, savedPlan?: string | null): SubscriptionPlan {
  if (savedPlan === 'pro') return 'pro'
  return email && proEmails.has(email.trim().toLowerCase()) ? 'pro' : 'free-trial'
}

export function getSubscriptionLabel(plan: SubscriptionPlan) {
  return plan === 'pro' ? 'Mwenje Pro' : 'Free Trial'
}
