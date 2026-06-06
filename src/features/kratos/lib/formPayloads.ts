import { compactOptionalText } from "@/entities/kratos/lib/domain"
import type {
  AgentCheckinPayload,
  BodyMetricForm,
  BodyMetricPayload,
  DietIntakeForm,
  FitnessProfilePayload,
  FoodEstimateItem,
  HealthMetricForm,
  HealthMetricPayload,
  ProfileForm,
} from "@/entities/kratos/model/types"

type BodyPayload = {
  checkin: AgentCheckinPayload
  hasCheckinData: boolean
  hasMetricData: boolean
  metric: BodyMetricPayload
}

type HealthPayload = {
  hasHealthData: boolean
  metric: HealthMetricPayload
}

type DietPayload = {
  hasDietData: boolean
  item: FoodEstimateItem | null
  mealDate: string | null
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
    hyperate_id: compactOptionalText(form.hyperateId),
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
  const thighCm = parseOptionalNumber(form.thighCm, "大腿围")
  if (typeof thighCm === "string") {
    setError(thighCm)
    return null
  }
  const calfCm = parseOptionalNumber(form.calfCm, "小腿围")
  if (typeof calfCm === "string") {
    setError(calfCm)
    return null
  }
  const armCm = parseOptionalNumber(form.armCm, "臂围")
  if (typeof armCm === "string") {
    setError(armCm)
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
      chestCm !== null ||
      waistCm !== null ||
      hipCm !== null ||
      thighCm !== null ||
      calfCm !== null ||
      armCm !== null ||
      notes !== null,
    metric: compactPayload({
      height_cm: heightCm,
      weight_kg: weightKg,
      target_weight_kg: targetWeightKg,
      body_fat_percentage: bodyFatPercentage,
      skeletal_muscle_mass_kg: skeletalMuscleMassKg,
      chest_cm: chestCm,
      waist_cm: waistCm,
      hip_cm: hipCm,
      thigh_cm: thighCm,
      calf_cm: calfCm,
      arm_cm: armCm,
      notes,
    }),
  }
}

export function buildHealthPayload(
  form: HealthMetricForm,
  setError: (message: string | null) => void
): HealthPayload | null {
  const sleepHours = parseOptionalNumber(form.sleepHours, "睡眠时长")
  if (typeof sleepHours === "string") {
    setError(sleepHours)
    return null
  }
  const activeKcal = parseOptionalNumber(form.activeKcal, "活动消耗")
  if (typeof activeKcal === "string") {
    setError(activeKcal)
    return null
  }
  const dietaryKcal = parseOptionalNumber(form.dietaryKcal, "饮食摄入")
  if (typeof dietaryKcal === "string") {
    setError(dietaryKcal)
    return null
  }
  const hrvMs = parseOptionalNumber(form.hrvMs, "HRV")
  if (typeof hrvMs === "string") {
    setError(hrvMs)
    return null
  }
  const stressLevel = parseOptionalInteger(form.stressLevel, "压力")
  if (typeof stressLevel === "string") {
    setError(stressLevel)
    return null
  }
  const restingHeartRate = parseOptionalInteger(form.restingHeartRate, "静息心率")
  if (typeof restingHeartRate === "string") {
    setError(restingHeartRate)
    return null
  }
  const vo2Max = parseOptionalNumber(form.vo2Max, "最大摄氧量")
  if (typeof vo2Max === "string") {
    setError(vo2Max)
    return null
  }
  const bloodOxygenPercentage = parseOptionalNumber(form.bloodOxygenPercentage, "血氧饱和度")
  if (typeof bloodOxygenPercentage === "string") {
    setError(bloodOxygenPercentage)
    return null
  }
  const notes = compactOptionalText(form.notes)

  if (stressLevel !== null && (stressLevel < 0 || stressLevel > 10)) {
    setError("压力必须在 0 到 10 之间")
    return null
  }

  return {
    hasHealthData:
      sleepHours !== null ||
      activeKcal !== null ||
      dietaryKcal !== null ||
      hrvMs !== null ||
      stressLevel !== null ||
      restingHeartRate !== null ||
      vo2Max !== null ||
      bloodOxygenPercentage !== null ||
      notes !== null,
    metric: compactPayload({
      sleep_hours: sleepHours,
      active_kcal: activeKcal,
      dietary_kcal: dietaryKcal,
      hrv_ms: hrvMs,
      stress_level: stressLevel,
      resting_heart_rate: restingHeartRate,
      vo2_max: vo2Max,
      blood_oxygen_percentage: bloodOxygenPercentage,
      notes,
    }),
  }
}

export function buildDietPayload(
  form: DietIntakeForm,
  setError: (message: string | null) => void
): DietPayload | null {
  const name = compactOptionalText(form.name)
  const estimatedWeightG = parseOptionalNumber(form.estimatedWeightG, "食物重量")
  const estimatedKcal = parseOptionalNumber(form.estimatedKcal, "摄入热量")
  const proteinG = parseOptionalNumber(form.proteinG, "蛋白质")
  const fatG = parseOptionalNumber(form.fatG, "脂肪")
  const carbsG = parseOptionalNumber(form.carbsG, "碳水")

  if (typeof estimatedWeightG === "string") {
    setError(estimatedWeightG)
    return null
  }
  if (typeof estimatedKcal === "string") {
    setError(estimatedKcal)
    return null
  }
  if (typeof proteinG === "string") {
    setError(proteinG)
    return null
  }
  if (typeof fatG === "string") {
    setError(fatG)
    return null
  }
  if (typeof carbsG === "string") {
    setError(carbsG)
    return null
  }

  const hasDietData =
    name !== null ||
    estimatedWeightG !== null ||
    estimatedKcal !== null ||
    proteinG !== null ||
    fatG !== null ||
    carbsG !== null

  if (!hasDietData) {
    return {
      hasDietData: false,
      item: null,
      mealDate: compactOptionalText(form.mealDate),
    }
  }

  if (!name) {
    setError("饮食记录需要填写食物名称")
    return null
  }

  return {
    hasDietData: true,
    item: {
      assumptions: [],
      carbs_g: carbsG ?? 0,
      confidence: 1,
      estimated_kcal: estimatedKcal ?? 0,
      estimated_weight_g: estimatedWeightG ?? 0,
      fat_g: fatG ?? 0,
      max_kcal: estimatedKcal ?? 0,
      min_kcal: estimatedKcal ?? 0,
      name,
      protein_g: proteinG ?? 0,
      source: "manual",
    },
    mealDate: compactOptionalText(form.mealDate),
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
