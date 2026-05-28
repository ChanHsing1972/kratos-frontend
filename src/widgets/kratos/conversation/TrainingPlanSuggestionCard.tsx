import { Check, ChevronRight, ExternalLink, PencilLine, Play } from "lucide-react"

import type { TrainingPlanPayload } from "@/entities/kratos/model/types"
import { ActionImage } from "@/shared/ui/ActionImage"

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
  const mediaExercises =
    plan.schedule_json?.weeks
      .flatMap((week) => week.sessions)
      .flatMap((session) => session.exercises)
      .filter((exercise) => Boolean(exercise.media?.media_url))
      .slice(0, 4) ?? []
  const teachingVideos =
    plan.schedule_json?.weeks
      .flatMap((week) => week.sessions)
      .flatMap((session) => session.exercises)
      .map((exercise) => {
        const video = exercise.media?.teaching_videos?.[0]
        return video
          ? {
          ...video,
          exerciseName: exercise.name,
          }
          : null
      })
      .filter((video): video is NonNullable<typeof video> => Boolean(video))
      .slice(0, 3) ?? []
  const scheduleLines =
    plan.weekly_schedule
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, isProgram ? 7 : 3) ?? []

  return (
    <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4 shadow-[0_10px_24px_rgba(17,17,17,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {isProgram ? "AI 周期计划草稿" : "AI 今日训练建议"}
          </p>
          <h4 className="mt-1 text-[15px] font-black tracking-[-0.03em] text-foreground">
            {plan.title}
          </h4>
          {plan.goal ? (
            <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
              {plan.goal}
            </p>
          ) : null}
          {isProgram && (plan.duration_weeks || sessionCount) ? (
            <p className="mt-1 text-[12px] text-muted-foreground">
              {plan.duration_weeks ? `周期：${plan.duration_weeks} 周` : null}
              {plan.duration_weeks && sessionCount ? " · " : null}
              {sessionCount ? `每周 ${sessionCount} 项安排` : null}
            </p>
          ) : null}
        </div>
        {created ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-primary bg-card px-2.5 py-1 text-[11px] font-bold text-foreground">
            <Check className="size-3.5" />
            已生成
          </span>
        ) : null}
      </div>

      {scheduleLines.length ? (
        <div className="mt-3 space-y-2">
          {scheduleLines.map((line) => (
            <p
              className="rounded-[8px] border border-border bg-card px-3 py-2 text-[12px] leading-5 text-muted-foreground"
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
            <figure
              className="overflow-hidden rounded-[8px] border border-border bg-card"
              key={`${exercise.id}-${exercise.name}`}
            >
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
          ))}
        </div>
      ) : null}

      {teachingVideos.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {teachingVideos.map((video) => (
            <a
              className="overflow-hidden rounded-[8px] border border-border bg-card text-[12px] text-foreground transition hover:border-primary"
              href={video.url}
              key={`${video.source}-${video.external_id ?? video.url}`}
              rel="noreferrer"
              target="_blank"
            >
              <span className="relative block aspect-video bg-muted">
                {video.thumbnail_url ? (
                  <img
                    alt={video.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                    src={video.thumbnail_url}
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
                <span className="block truncate font-bold">{video.exerciseName} 教学视频</span>
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
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary px-3 text-[12px] font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={created || loading}
          onClick={onCreate}
          type="button"
        >
          {created ? "已保存到训练计划" : loading ? "保存中..." : isProgram ? "保存草稿" : "生成今日计划"}
          <ChevronRight className="size-3.5" />
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-[12px] font-bold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={created || loading}
          onClick={onEdit}
          type="button"
        >
          <PencilLine className="size-3.5" />
          先编辑
        </button>
      </div>
    </section>
  )
}
