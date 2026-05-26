import {
  getCurrentUser,
  getFitnessContext,
  listAgentRuns,
  listAgentTools,
  listSkills,
  listTrainingPlans,
} from "@/entities/kratos/api/client"
import type {
  AgentRun,
  AgentToolConfig,
  FitnessContext,
  Skill,
  TrainingPlan,
  UserProfile,
} from "@/entities/kratos/model/types"

export type DashboardSnapshot = {
  context: FitnessContext
  plans: TrainingPlan[]
  runs: AgentRun[]
  skills: Skill[]
  tools: AgentToolConfig[]
}

export type InitialAuthSnapshot = DashboardSnapshot & {
  user: UserProfile
}

let initialAuthSnapshot:
  | {
      promise: Promise<InitialAuthSnapshot>
      token: string
    }
  | null = null

export async function loadDashboardSnapshot(
  token: string
): Promise<DashboardSnapshot> {
  const [context, plans, runs, skills, tools] = await Promise.all([
    getFitnessContext(token),
    listTrainingPlans(token),
    listAgentRuns(token, 200),
    listSkills(token),
    listAgentTools(token),
  ])

  return {
    context,
    plans,
    runs,
    skills,
    tools,
  }
}

export function loadInitialAuthSnapshot(
  token: string
): Promise<InitialAuthSnapshot> {
  if (initialAuthSnapshot?.token === token) {
    return initialAuthSnapshot.promise
  }

  const promise = Promise.all([
    getCurrentUser(token),
    loadDashboardSnapshot(token),
  ]).then(([user, snapshot]) => ({
    ...snapshot,
    user,
  }))

  initialAuthSnapshot = {
    promise,
    token,
  }

  return promise
}

export function clearInitialAuthSnapshot() {
  initialAuthSnapshot = null
}
