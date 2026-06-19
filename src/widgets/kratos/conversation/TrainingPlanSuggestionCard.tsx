import { Calendar, Check, ExternalLink, ListChecks, PencilLine, Play, Video } from "lucide-react"

import { proxiedBilibiliImageUrl } from "@/entities/kratos/api/client"
import type {
  TrainingExerciseVideo,
  TrainingPlanPayload,
  TrainingScheduleExercise,
  TrainingScheduleSession,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/shared/ui/item"
import { Separator } from "@/shared/ui/separator"
import { Skeleton } from "@/shared/ui/skeleton"
import { Spinner } from "@/shared/ui/spinner"

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
  const sessions = plan.schedule_json?.weeks.flatMap((week) => week.sessions) ?? []
  const exercises = sessions.flatMap((session) => session.exercises)
  const visibleSessions = sessions.slice(0, 7)
  const visibleExercises = exercises.filter((exercise) => exercise.name.trim()).slice(0, 5)
  const videoEntries = visibleExercises
    .map((exercise) => ({
      exercise,
      video: exercise.media?.teaching_videos?.[0] ?? null,
    }))
    .filter((entry): entry is { exercise: TrainingScheduleExercise; video: TrainingExerciseVideo } =>
      Boolean(entry.video)
    )
    .slice(0, 3)
  const isProgram = plan.plan_kind === "program"

  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4" />
          {plan.title}
        </CardTitle>
        <CardDescription>
          {plan.summary || plan.goal || "已整理为可保存的结构化训练计划。"}
        </CardDescription>
        <CardAction>
          <Badge variant={created ? "default" : "secondary"}>
            {created ? "已保存" : isProgram ? "周计划" : "今日计划"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* <div className="grid gap-2 sm:grid-cols-3">
          <PlanMetric label="训练日" value={`${sessions.length || 1}`} />
          <PlanMetric label="动作数" value={`${visibleExercises.length || exercises.length}`} />
          <PlanMetric label="目标" value={plan.goal || "按计划执行"} />
        </div> */}

        {visibleSessions.length ? (
          <ItemGroup data-size="sm">
            {visibleSessions.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </ItemGroup>
        ) : null}

        {visibleExercises.length ? (
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              重点动作
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleExercises.map((exercise) => (
                <Badge key={`${exercise.id}-${exercise.name}`} variant="secondary">
                  {exercise.name}
                  {formatExerciseDose(exercise) ? ` · ${formatExerciseDose(exercise)}` : ""}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {videoEntries.length ? (
          <>
            <Separator />
            <div className="grid gap-2 sm:grid-cols-3">
              {videoEntries.map(({ exercise, video }) => (
                <VideoLink key={`${exercise.id}-${video.url}`} exercise={exercise} video={video} />
              ))}
            </div>
          </>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button
          disabled={created || loading}
          onClick={onEdit}
          type="button"
          variant="outline"
        >
          <PencilLine className="size-4" />
          编辑
        </Button>
        <Button disabled={created || loading} onClick={onCreate} type="button">
          {loading ? <Spinner /> : <Check className="size-4" />}
          {created
            ? "已保存"
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

export function TrainingPlanSuggestionCardSkeleton() {
  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-[78%]" />
        <CardAction>
          <Skeleton className="h-5 w-16 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="h-14" key={index} />
          ))}
        </div>
        <ItemGroup data-size="sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <Item key={index} size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Skeleton className="size-4 rounded-full" />
              </ItemMedia>
              <ItemContent>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  )
}

function SessionItem({ session }: { session: TrainingScheduleSession }) {
  const firstExercises = session.exercises
    .filter((exercise) => exercise.name.trim())
    .slice(0, 3)
    .map((exercise) => exercise.name)
    .join("、")
  const extraCount = Math.max(0, session.exercises.length - 3)

  return (
    <Item size="sm" variant="muted">
      <ItemMedia variant="icon">
        <Calendar className="size-4" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {session.weekday ? `${session.weekday} · ` : ""}
          {session.title || "训练日"}
        </ItemTitle>
        <ItemDescription>
          {firstExercises || "按计划完成"}
          {extraCount ? ` 等 ${session.exercises.length} 个动作` : ""}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant="secondary">{session.exercises.length} 项</Badge>
      </ItemActions>
    </Item>
  )
}

function VideoLink({
  exercise,
  video,
}: {
  exercise: TrainingScheduleExercise
  video: TrainingExerciseVideo
}) {
  const thumbnailUrl = proxiedBilibiliImageUrl(video.thumbnail_url)
  const dose = formatExerciseDose(exercise)

  return (
    <a
      className="group overflow-hidden rounded-lg border bg-card text-sm transition hover:bg-muted"
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
        ) : (
          <span className="grid h-full place-items-center text-muted-foreground">
            <Video className="size-5" />
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-background/20">
          <span className="grid size-8 place-items-center rounded-full bg-background/90">
            <Play className="size-3.5 fill-current" />
          </span>
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 p-2">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{exercise.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{dose || video.title}</span>
        </span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      </span>
    </a>
  )
}

// function PlanMetric({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-lg border p-3">
//       <div className="text-xs text-muted-foreground">{label}</div>
//       <div className="mt-1 line-clamp-1 font-medium">{value}</div>
//     </div>
//   )
// }

function formatExerciseDose(exercise: TrainingScheduleExercise) {
  const parts = [
    exercise.target_sets ? `${exercise.target_sets}组` : null,
    exercise.target_reps,
  ].filter(Boolean)

  return parts.join("x")
}
