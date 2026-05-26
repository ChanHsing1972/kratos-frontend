import { compactOptionalText } from "@/entities/kratos/lib/domain"
import type {
  AgentCheckinPayload,
  BodyMetricForm,
  BodyMetricPayload,
  FitnessProfilePayload,
  ProfileForm,
} from "@/entities/kratos/model/types"

type BodyPayload = {
  checkin: AgentCheckinPayload
  hasCheckinData: boolean
  hasMetricData: boolean
  metric: BodyMetricPayload
}

export function buildProfilePayload(
  form: ProfileForm,
  setError: (message: string | null) => void
): FitnessProfilePayload | null {
  const age = form.age.trim()
  const parsedAge = age ? Number(age) : null
  if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0)) {
    setError("年龄必须是 0 或更大的整数")
    return null
  }

  const parsedDays = parseOptionalInteger(
    form.availableDaysPerWeek,
    "每周可训练天数"
  )
  if (typeof parsedDays === "string") {
    setError(parsedDays)
    return null
  }
  if (parsedDays !== null && parsedDays > 7) {
    setError("每周可训练天数不能超过 7")
    return null
  }

  const parsedMinutes = parseOptionalInteger(
    form.workoutMinutesPerSession,
    "单次训练时长"
  )
  if (typeof parsedMinutes === "string") {
    setError(parsedMinutes)
    return null
  }

  return {
    age: parsedAge,
    activity_level: compactOptionalText(form.activityLevel),
    available_days_per_week: parsedDays,
    dietary_habits: compactOptionalText(form.dietaryHabits),
    dietary_restrictions: compactOptionalText(form.dietaryRestrictions),
    equipment_access: compactOptionalText(form.equipmentAccess),
    experience_level: compactOptionalText(form.experienceLevel),
    fitness_goal: compactOptionalText(form.fitnessGoal),
    fitness_summary: compactOptionalText(form.fitnessSummary),
    gender: compactOptionalText(form.gender),
    injury_history: compactOptionalText(form.injuryHistory),
    location: compactOptionalText(form.location),
    medical_conditions: compactOptionalText(form.medicalConditions),
    preferred_workout_types: compactOptionalText(form.preferredWorkoutTypes),
    workout_minutes_per_session: parsedMinutes,
  }
}

export function buildBodyPayload(
  form: BodyMetricForm,
  setError: (message: string | null) => void
): BodyPayload | null {
  const heightCm = parseOptionalNumber(form.heightCm, "身高")
  if (typeof heightCm === "string") {
    setError(heightCm)
    return null
  }
  const weightKg = parseOptionalNumber(form.weightKg, "体重")
  if (typeof weightKg === "string") {
    setError(weightKg)
    return null
  }
  const targetWeightKg = parseOptionalNumber(form.targetWeightKg, "目标体重")
  if (typeof targetWeightKg === "string") {
    setError(targetWeightKg)
    return null
  }
  const bodyFatPercentage = parseOptionalNumber(
    form.bodyFatPercentage,
    "体脂率"
  )
  if (typeof bodyFatPercentage === "string") {
    setError(bodyFatPercentage)
    return null
  }
  const skeletalMuscleMassKg = parseOptionalNumber(
    form.skeletalMuscleMassKg,
    "骨骼肌"
  )
  if (typeof skeletalMuscleMassKg === "string") {
    setError(skeletalMuscleMassKg)
    return null
  }
  const bmi = parseOptionalNumber(form.bmi, "BMI")
  if (typeof bmi === "string") {
    setError(bmi)
    return null
  }
  const chestCm = parseOptionalNumber(form.chestCm, "胸围")
  if (typeof chestCm === "string") {
    setError(chestCm)
    return null
  }
  const waistCm = parseOptionalNumber(form.waistCm, "腰围")
  if (typeof waistCm === "string") {
    setError(waistCm)
    return null
  }
  const hipCm = parseOptionalNumber(form.hipCm, "臀围")
  if (typeof hipCm === "string") {
    setError(hipCm)
    return null
  }
  const sleepHours = parseOptionalNumber(form.sleepHours, "睡眠时长")
  if (typeof sleepHours === "string") {
    setError(sleepHours)
    return null
  }
  const energyLevel = parseOptionalInteger(form.energyLevel, "精力")
  if (typeof energyLevel === "string") {
    setError(energyLevel)
    return null
  }
  const sleepQuality = parseOptionalInteger(form.sleepQuality, "睡眠质量")
  if (typeof sleepQuality === "string") {
    setError(sleepQuality)
    return null
  }
  const sorenessLevel = parseOptionalInteger(form.sorenessLevel, "酸痛")
  if (typeof sorenessLevel === "string") {
    setError(sorenessLevel)
    return null
  }
  const notes = compactOptionalText(form.notes)
  const mood = compactOptionalText(form.mood)
  const painNotes = compactOptionalText(form.painNotes)

  for (const [label, value] of [
    ["精力", energyLevel],
    ["睡眠质量", sleepQuality],
    ["酸痛", sorenessLevel],
  ] as const) {
    if (value !== null && (value < 1 || value > 10)) {
      setError(`${label}必须在 1 到 10 之间`)
      return null
    }
  }

  return {
    checkin: compactPayload({
      energy_level: energyLevel,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      soreness_level: sorenessLevel,
      mood,
      pain_notes: painNotes,
    }),
    hasCheckinData:
      energyLevel !== null ||
      sleepHours !== null ||
      sleepQuality !== null ||
      sorenessLevel !== null ||
      mood !== null ||
      painNotes !== null,
    hasMetricData:
      heightCm !== null ||
      weightKg !== null ||
      targetWeightKg !== null ||
      bodyFatPercentage !== null ||
      skeletalMuscleMassKg !== null ||
      bmi !== null ||
      chestCm !== null ||
      waistCm !== null ||
      hipCm !== null ||
      notes !== null,
    metric: compactPayload({
      height_cm: heightCm,
      weight_kg: weightKg,
      target_weight_kg: targetWeightKg,
      body_fat_percentage: bodyFatPercentage,
      skeletal_muscle_mass_kg: skeletalMuscleMassKg,
      bmi,
      chest_cm: chestCm,
      waist_cm: waistCm,
      hip_cm: hipCm,
      notes,
    }),
  }
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null)
  ) as Partial<T>
}

function parseOptionalNumber(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return `${label}必须是 0 或更大的数字`
  }

  return parsed
}

function parseOptionalInteger(value: string, label: string) {
  const parsed = parseOptionalNumber(value, label)
  if (parsed === null || typeof parsed === "string") {
    return parsed
  }

  if (!Number.isInteger(parsed)) {
    return `${label}必须是整数`
  }

  return parsed
}
