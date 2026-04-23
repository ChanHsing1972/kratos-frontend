import type { LucideIcon } from "lucide-react"

export type NavItem = {
  label: string
  icon: LucideIcon
  badge?: string
}

export type TimelineItem = {
  label: string
  time: string
  body: string
  icon: "thought" | "action" | "observation" | "final"
}

export type Metric = {
  label: string
  value: string
  unit?: string
  icon: LucideIcon
}

export type QuickAction = {
  title: string
  description: string
  icon: LucideIcon
  prompt: string
}

export type UserProfile = {
  id: number
  username: string
  gender: string | null
  age: number | null
  location: string | null
  dietary_habits: string | null
  fitness_status: string | null
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type AuthMode = "login" | "register"

export type AuthForm = {
  username: string
  password: string
  location: string
  fitnessStatus: string
}

export type ProfileForm = {
  gender: string
  age: string
  location: string
  dietaryHabits: string
  fitnessStatus: string
}

export type UserRegisterPayload = {
  username: string
  password: string
  location: string | null
  fitness_status: string | null
}

export type UserUpdatePayload = {
  gender?: string | null
  age?: number | null
  location?: string | null
  dietary_habits?: string | null
  fitness_status?: string | null
}

export type ChatMessage = {
  id: string
  author: "user" | "assistant"
  body: string
  time: string
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  read: boolean
}

export type DetailPanel = {
  title: string
  body: string
  items?: string[]
}
