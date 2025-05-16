export interface Drawing {
  id: string
  name: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  plan: "FREE" | "PRO"
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}
