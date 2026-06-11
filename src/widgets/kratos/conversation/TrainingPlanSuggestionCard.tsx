import { Check, ChevronRight, ExternalLink, PencilLine, Play } from "lucide-react"

import { proxiedBilibiliImageUrl } from "@/entities/kratos/api/client"
import type {
  TrainingPlanPayload,
  TrainingScheduleExercise,
} from "@/entities/kratos/model/types"
import { useExerciseMedia } from "@/shared/hooks/useExerciseMedia"
import { ActionImage } from "@/shared/ui/ActionImage"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"

type TrainingPlanSuggestionCardProps = {
  created: boolean
  loading: boolean
  onCreate: () => void
  onEdit: () => void
  plan: TrainingPlanPayload
}

export function TrainingPlanSuggestionCard({
  created,
  loading,
  onCreate,
  onEdit,
  plan,
}: TrainingPlanSuggestionCardProps) {
  const isProgram = plan.plan_kind === "program"
  const sessionCount = plan.schedule_json?.weeks[0]?.sessions.length ?? 0
  const exercises =
    plan.schedule_json?.weeks
      .flatMap((week) => week.sessions)
      .flatMap((session) => session.exercises)
      .filter((exercise) => exercise.name.trim()) ?? []
  const mediaExercises = exercises.slice(0, 4)
  const videoExercises = exercises.slice(0, 3)
  const scheduleLines =
    plan.weekly_schedule
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, isProgram ? 7 : 3) ?? []

  return (
    <Card className="mt-4 bg-muted/40">
      <CardHeader >
        <CardTitle >
          {plan.title}
        </CardTitle>
        <CardDescription>
          {plan.goal || (isProgram && (plan.duration_weeks || sessionCount)) ? (
            <p className="flex flex-wrap items-center gap-x-1">
              {plan.goal ? <span>{plan.goal}</span> : null}
              {/* {plan.goal && isProgram && (plan.duration_weeks || sessionCount) ? (
                <span>·</span>
              ) : null}
              {isProgram && (plan.duration_weeks || sessionCount) ? (
                <span>
                  {plan.duration_weeks ? `周期 ${plan.duration_weeks} 周` : null}
                  {plan.duration_weeks && sessionCount ? " · " : null}
                  {sessionCount ? `每周 ${sessionCount} 项安排` : null}
                </span>
              ) : null} */}
            </p>
          ) : null}
        </CardDescription>
        {created ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-primary bg-card px-2.5 py-1 text-[11px] font-bold text-foreground">
            <Check className="size-3.5" />
            已生成
          </span>
        ) : null}
      </CardHeader>

      <CardContent>
        {scheduleLines.length ? (
          <div className="space-y-2">
            {scheduleLines.map((line) => (
              <p
                className="text-sm leading-6 text-foreground"
                key={line}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {mediaExercises.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {mediaExercises.map((exercise) => (
              <ExerciseMediaFigure
                exercise={exercise}
                key={`${exercise.id}-${exercise.name}`}
              />
            ))}
          </div>
        ) : null}

        {videoExercises.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {videoExercises.map((exercise) => (
              <TeachingVideoPreview
                exercise={exercise}
                key={`${exercise.id}-${exercise.name}`}
              />
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">

        <Button
          disabled={created || loading}
          onClick={onEdit}
          type="button"
          variant="outline"
        >
          <PencilLine className="size-3.5" />
          编辑
        </Button>
        <Button
          disabled={created || loading}
          onClick={onCreate}
          type="button"
        >
          <Check className="size-3.5" />
          {created
            ? "已保存到训练计划"
            : loading
              ? "保存中..."
              : isProgram
                ? "保存草稿"
                : "生成今日计划"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function ExerciseMediaFigure({
  exercise,
}: {
  exercise: TrainingScheduleExercise
}) {
  return (
    <figure className="overflow-hidden rounded-[8px] border border-border bg-card">
      <div className="relative aspect-[4/3] bg-foreground">
        <ActionImage
          actionName={exercise.name}
          className="absolute inset-0"
          media={exercise.media}
        />
      </div>
      <figcaption className="truncate px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
        {exercise.name}
      </figcaption>
    </figure>
  )
}

function TeachingVideoPreview({
  exercise,
}: {
  exercise: TrainingScheduleExercise
}) {
  const { loading, media } = useExerciseMedia(exercise.name)
  const video = exercise.media?.teaching_videos?.[0] ?? media?.teaching_videos?.[0]

  if (!video) {
    if (!loading) {
      return null
    }
    return (
      <div className="overflow-hidden rounded-[8px] border border-border bg-card text-[12px] text-muted-foreground">
        <div className="grid aspect-video place-items-center bg-muted">
          正在查找教学视频...
        </div>
        <div className="px-2.5 py-2 font-semibold">{exercise.name}</div>
      </div>
    )
  }

  const thumbnailUrl = proxiedBilibiliImageUrl(video.thumbnail_url)

  return (
    <a
      className="overflow-hidden rounded-[8px] border border-border bg-card text-[12px] text-foreground transition hover:border-primary"
      href={video.url}
      rel="noreferrer"
      target="_blank"
    >
      <span className="relative block aspect-video bg-muted">
        {thumbnailUrl ? (
          <img
            alt={video.title}
            className="h-full w-full object-cover"
            draggable={false}
            src={thumbnailUrl}
          />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Play className="size-4 fill-current" />
          </span>
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 px-2.5 py-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{exercise.name} 教学视频</span>
          <span className="block truncate text-muted-foreground">{video.title}</span>
          {video.search_query ? (
            <span className="block truncate text-[10px] text-muted-foreground/80">
              {video.search_query}
            </span>
          ) : null}
        </span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      </span>
    </a>
  )
}
