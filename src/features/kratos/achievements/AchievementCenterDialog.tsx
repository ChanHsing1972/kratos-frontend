import {
  CalendarCheck,
  Flame,
  HeartPulse,
  Timer,
  Trophy,
} from "lucide-react"

import type {
  AgentCheckin,
  BodyMetric,
  WorkoutLog,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Progress } from "@/shared/ui/progress"

type AchievementCenterDialogProps = {
  bodyMetrics: BodyMetric[]
  checkins: AgentCheckin[]
  onOpenChange: (open: boolean) => void
  open: boolean
  workoutLogs: WorkoutLog[]
}

type Achievement = {
  current: number
  description: string
  goal: number
  icon: typeof Trophy
  title: string
}

export function AchievementCenterDialog({
  bodyMetrics,
  checkins,
  onOpenChange,
  open,
  workoutLogs,
}: AchievementCenterDialogProps) {
  const completedLogs = workoutLogs.filter((log) => log.completed)
  const weekLogs = completedLogs.filter((log) => isThisWeek(log.workout_date))
  const totalSeconds = completedLogs.reduce(
    (sum, log) => sum + workoutSeconds(log),
    0
  )
  const weekSeconds = weekLogs.reduce((sum, log) => sum + workoutSeconds(log), 0)
  const streakDays = calculateTrainingStreak(completedLogs)
  const achievements: Achievement[] = [
    {
      current: completedLogs.length,
      description: "完成并保存第一次训练",
      goal: 1,
      icon: Trophy,
      title: "初出茅庐",
    },
    {
      current: weekLogs.length,
      description: "一周内完成 3 次训练",
      goal: 3,
      icon: CalendarCheck,
      title: "保持节奏",
    },
    {
      current: Math.floor(weekSeconds / 60),
      description: "本周累计训练 120 分钟",
      goal: 120,
      icon: Timer,
      title: "时间银行",
    },
    {
      current: streakDays,
      description: "连续训练 3 天",
      goal: 3,
      icon: Flame,
      title: "连续火花",
    },
    {
      current: bodyMetrics.length + checkins.length,
      description: "累计记录 5 条身体数据",
      goal: 5,
      icon: HeartPulse,
      title: "数据建档",
    }
  ]
  const unlocked = achievements.filter((item) => item.current >= item.goal).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86svh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>我的成就</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="已解锁" value={`${unlocked}/${achievements.length}`} />
          <SummaryCard label="累计训练" value={formatDuration(totalSeconds)} />
          <SummaryCard label="连续天数" value={`${streakDays} 天`} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            const progress = Math.min(
              100,
              Math.round((achievement.current / achievement.goal) * 100)
            )
            const unlockedAchievement = achievement.current >= achievement.goal
            return (
              <Card key={achievement.title}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 place-items-center rounded-md bg-muted">
                      <Icon />
                    </span>
                    <div>
                      <CardTitle className="text-sm">{achievement.title}</CardTitle>
                      <CardDescription>
                        {achievement.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={unlockedAchievement ? "default" : "secondary"}>
                    {unlockedAchievement ? "已解锁" : "进行中"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-end text-xs text-muted-foreground">
                    <span>{achievement.current}/{achievement.goal}</span>
                  </div>
                  <Progress className="mt-2" value={progress} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl">{value}</p>
      </CardContent>
    </Card>
  )
}

function workoutSeconds(log: WorkoutLog) {
  return log.duration_seconds ?? (log.duration_minutes ?? 0) * 60
}

function isThisWeek(value: string) {
  const date = dateFromValue(value)
  const now = new Date()
  const start = startOfWeek(now)
  const end = addDays(start, 6)
  return date >= start && date <= end
}

function calculateTrainingStreak(logs: WorkoutLog[]) {
  const trainedDates = new Set(logs.map((log) => log.workout_date))
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (trainedDates.has(localDateValue(cursor)) && streak < 365) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return restMinutes ? `${hours} 小时 ${restMinutes} 分钟` : `${hours} 小时`
}

function dateFromValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfWeek(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - ((next.getDay() + 6) % 7))
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
