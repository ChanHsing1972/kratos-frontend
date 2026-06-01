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

export type AgentTraceStep = {
  type:
    | "status"
    | "thought"
    | "action"
    | "observation"
    | "reflection"
    | "final"
    | "answer_delta"
    | "done"
    | "error"
  content: string
  timestamp?: string
  raw?: unknown
}

export type AgentStreamEvent = AgentTraceStep & {
  session_id?: string
  answer?: string
  delta?: string
}

export type ChatAttachment = {
  content_type: string
  data_url?: string | null
  filename: string
  size: number
  url: string
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

export type ChatSession = {
  id: string
  title: string
  summary?: string | null
  preview: string
  updatedAt: string
  messageCount: number
  pinned?: boolean
  archived?: boolean
  deleted?: boolean
  shared?: boolean
  createdAt?: string
  lastRunAt?: string | null
  lastMessage?: string | null
}

export type AgentConversationSession = {
  session_id: string
  title: string
  summary: string | null
  is_pinned: boolean
  is_archived: boolean
  is_deleted: boolean
  is_shared: boolean
  created_at: string
  updated_at: string
  run_count: number
  last_run_at: string | null
  last_message: string | null
}

export type UserProfile = {
  id: number
  username: string
  avatar_url?: string | null
  created_at: string
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type AuthMode = "login" | "register"

export type AuthForm = {
  username: string
  password: string
}

export type ProfileForm = {
  gender: string
  age: string
  location: string
  fitnessGoal: string
  fitnessSummary: string
  activityLevel: string
  experienceLevel: string
  availableDaysPerWeek: string
  workoutMinutesPerSession: string
  equipmentAccess: string
  injuryHistory: string
  medicalConditions: string
  preferredWorkoutTypes: string
  dietaryHabits: string
  dietaryRestrictions: string
}

export type UserRegisterPayload = {
  username: string
  password: string
}

export type UserUpdatePayload = Record<string, never>

export type Skill = {
  id: number
  name: string
  slug: string
  description: string | null
  applicable_scenarios: string | null
  prompt_snippet: string | null
  available_tools: string[]
  output_format: string | null
  forbidden_rules: string | null
  definition: string | null
  owner_user_id: number | null
  is_builtin: boolean
  is_public: boolean
  enabled: boolean
  source: "builtin" | "custom" | string
  created_at: string
  updated_at: string
}

export type SkillPayload = {
  name: string
  description?: string | null
  applicable_scenarios?: string | null
  prompt_snippet?: string | null
  available_tools?: string[]
  output_format?: string | null
  forbidden_rules?: string | null
  definition?: string | null
}

export type AgentToolConfig = {
  id: number
  name: string
  description: string | null
  category: string
  enabled: boolean
  requires_api_key: boolean
  health_status: "unknown" | "healthy" | "degraded" | "unavailable" | "disabled" | string
  failure_count: number
  api_key_configured: boolean
  created_at: string
  updated_at: string
}

export type FitnessProfile = {
  id: number
  user_id: number
  gender: string | null
  age: number | null
  location: string | null
  fitness_goal: string | null
  fitness_summary: string | null
  activity_level: string | null
  experience_level: string | null
  available_days_per_week: number | null
  workout_minutes_per_session: number | null
  equipment_access: string | null
  injury_history: string | null
  medical_conditions: string | null
  preferred_workout_types: string | null
  dietary_habits: string | null
  dietary_restrictions: string | null
  created_at: string
  updated_at: string
}

export type FitnessProfilePayload = Partial<
  Omit<FitnessProfile, "created_at" | "id" | "updated_at" | "user_id">
>

export type TrainingPlan = {
  id: number
  user_id: number
  title: string
  goal: string | null
  status: string
  plan_kind: "daily" | "program"
  duration_weeks: number | null
  schedule_json: TrainingSchedule | null
  start_date: string | null
  end_date: string | null
  summary: string | null
  weekly_schedule: string | null
  nutrition_guidance: string | null
  recovery_guidance: string | null
  created_at: string
  updated_at: string
}

export type TrainingPlanPayload = {
  title: string
  goal?: string | null
  status?: string
  plan_kind?: "daily" | "program"
  duration_weeks?: number | null
  schedule_json?: TrainingSchedule | null
  start_date?: string | null
  end_date?: string | null
  summary?: string | null
  weekly_schedule?: string | null
  nutrition_guidance?: string | null
  recovery_guidance?: string | null
}

export type TrainingScheduleExercise = {
  id: string
  name: string
  media?: TrainingExerciseMedia | null
  target_sets?: number | null
  target_reps?: string | null
  target_weight_kg?: number | null
  target_rpe?: number | null
  rest_seconds?: number | null
  notes?: string | null
}

export type TrainingExerciseMedia = {
  action_name?: string | null
  exercise_id?: string | null
  exercise_name?: string | null
  image_url?: string | null
  media_url?: string | null
  query?: string | null
  source?: string | null
  teaching_videos?: TrainingExerciseVideo[]
  video_url?: string | null
}

export type TrainingExerciseVideo = {
  author?: string | null
  confidence?: number | null
  duration_seconds?: number | null
  embed_url?: string | null
  external_id?: string | null
  search_query?: string | null
  source: string
  status?: string | null
  thumbnail_url?: string | null
  title: string
  url: string
}

export type TrainingScheduleSession = {
  id: string
  weekday: string
  title: string
  exercises: TrainingScheduleExercise[]
}

export type TrainingSchedule = {
  version: number
  weeks: Array<{ week: number; sessions: TrainingScheduleSession[] }>
}

export type TrainingPlanAdjustmentPayload = {
  feedback: string
  workout_log_id?: number | null
  workout_title?: string | null
  completed?: boolean | null
  duration_seconds?: number | null
}

export type TrainingPlanAdjustmentResponse = {
  proposal: Partial<TrainingPlanPayload>
  rationale: string[]
}

export type TrainingPlanForm = {
  title: string
  goal: string
  status: string
  startDate: string
  endDate: string
  summary: string
  weeklySchedule: string
  nutritionGuidance: string
  recoveryGuidance: string
}

export type TrainingPlanTemplate = TrainingPlanPayload & {
  id: string
  duration: string
  frequency: string
  level: string
}

export type BodyMetric = {
  id: number
  user_id: number
  height_cm: number | null
  weight_kg: number | null
  target_weight_kg: number | null
  body_fat_percentage: number | null
  skeletal_muscle_mass_kg: number | null
  bmi: number | null
  chest_cm: number | null
  waist_cm: number | null
  hip_cm: number | null
  sleep_hours: number | null
  notes: string | null
  recorded_at: string
  measured_at: string | null
  source: string
  external_id: string | null
}

export type WorkoutLog = {
  id: number
  user_id: number
  training_plan_id: number | null
  workout_date: string
  workout_type: string | null
  title: string | null
  duration_minutes: number | null
  duration_seconds: number | null
  perceived_exertion: number | null
  calories_burned: number | null
  completed: boolean
  notes: string | null
  created_at: string
  exercises: WorkoutExerciseLog[]
}

export type WorkoutSetLog = {
  set_number: number
  reps?: number | null
  weight_kg?: number | null
  rpe?: number | null
  completed: boolean
  pain_notes?: string | null
}

export type WorkoutExerciseLog = {
  exercise_id?: string | null
  name: string
  position?: number
  completed: boolean
  notes?: string | null
  sets: WorkoutSetLog[]
}

export type WorkoutLogPayload = {
  training_plan_id?: number | null
  workout_date: string
  workout_type?: string | null
  title?: string | null
  duration_minutes?: number | null
  duration_seconds?: number | null
  perceived_exertion?: number | null
  calories_burned?: number | null
  completed?: boolean
  notes?: string | null
  exercises?: WorkoutExerciseLog[]
}

export type BodyMetricForm = {
  measuredAt: string
  heightCm: string
  weightKg: string
  targetWeightKg: string
  bodyFatPercentage: string
  skeletalMuscleMassKg: string
  bmi: string
  chestCm: string
  waistCm: string
  hipCm: string
  sleepHours: string
  energyLevel: string
  sleepQuality: string
  sorenessLevel: string
  mood: string
  painNotes: string
  notes: string
}

export type BodyMetricPayload = {
  height_cm?: number | null
  weight_kg?: number | null
  target_weight_kg?: number | null
  body_fat_percentage?: number | null
  skeletal_muscle_mass_kg?: number | null
  bmi?: number | null
  chest_cm?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  sleep_hours?: number | null
  notes?: string | null
  measured_at?: string | null
  source?: string
  external_id?: string | null
}

export type OnboardingStatus = {
  profile_complete: boolean
  body_metrics_complete: boolean
  ready_for_agent: boolean
  missing_profile_fields: string[]
  missing_body_metric_fields: string[]
  next_steps: string[]
}

export type FitnessContext = {
  user: UserProfile
  profile: FitnessProfile | null
  latest_body_metric: BodyMetric | null
  recent_body_metrics: BodyMetric[]
  recent_workout_logs: WorkoutLog[]
  recent_checkins: AgentCheckin[]
  active_plan: TrainingPlan | null
  onboarding: OnboardingStatus
}

export type AgentCheckinPayload = {
  training_plan_id?: number | null
  energy_level?: number | null
  sleep_quality?: number | null
  soreness_level?: number | null
  checkin_date?: string | null
  sleep_hours?: number | null
  pain_notes?: string | null
  source?: string
  adherence_score?: number | null
  mood?: string | null
  summary?: string | null
}

export type AgentCheckin = {
  id: number
  user_id: number
  training_plan_id: number | null
  energy_level: number | null
  sleep_quality: number | null
  soreness_level: number | null
  checkin_date: string | null
  sleep_hours: number | null
  pain_notes: string | null
  source: string
  adherence_score: number | null
  mood: string | null
  summary: string | null
  created_at: string
}

export type AgentRunTraceStep = {
  id: number
  run_id: number
  position: number
  step_type: AgentTraceStep["type"] | string
  content: string
  raw: unknown | null
  created_at: string
}

export type AgentRun = {
  id: number
  user_id: number
  session_id: string
  client_turn_id?: string | null
  user_message: string
  answer: string
  status: string
  intent: unknown | null
  task_results: unknown | null
  tool_results: unknown | null
  reflection: unknown | null
  result_payload: unknown | null
  created_at: string
  trace_steps: AgentRunTraceStep[]
}

export type ChatMessage = {
  id: string
  author: "user" | "assistant"
  attachments?: ChatAttachment[]
  body: string
  time: string
  completedAt?: number
  error?: string
  suggestedTrainingPlan?: TrainingPlanPayload
  trainingPlanCreatedId?: number
  suggestedHealthData?: SuggestedHealthData
  healthDataSaved?: boolean
  startedAt?: number
  structuredCardPending?: boolean
  streaming?: boolean
  trace?: AgentTraceStep[]
}

export type SuggestedHealthData = {
  body_metric?: BodyMetricPayload
  checkin?: AgentCheckinPayload
  profile?: FitnessProfilePayload
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  read: boolean
}

export type WorkoutShareCard = {
  workout_title: string
  workout_date: string
  completed: boolean
  duration_seconds: number
  week_completed_count: number
  week_duration_seconds: number
  streak_days: number
  total_completed_count: number
  coach_comment: string
  highlights: string[]
}

export type DetailPanel = {
  title: string
  body: string
  items?: string[]
}
