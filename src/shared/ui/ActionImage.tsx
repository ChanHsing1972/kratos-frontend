import type { TrainingExerciseMedia } from "@/entities/kratos/model/types"

import { useExerciseMedia } from "../hooks/useExerciseMedia"

export function ActionImage({
  actionName,
  className,
  fit = "cover",
  media: embeddedMedia,
}: {
  actionName: string
  className?: string
  fit?: "contain" | "cover"
  media?: TrainingExerciseMedia | null
}) {
  const hasEmbeddedMedia = Boolean(
    embeddedMedia?.media_url || embeddedMedia?.image_url || embeddedMedia?.video_url
  )
  const { media: fetchedMedia, mediaUrl: fetchedMediaUrl, loading } = useExerciseMedia(
    actionName,
    !hasEmbeddedMedia
  )
  const media = hasEmbeddedMedia ? embeddedMedia : fetchedMedia
  const mediaUrl = media?.media_url ?? media?.image_url ?? media?.video_url ?? fetchedMediaUrl

  if (!mediaUrl) {
    if (!loading) {
      return (
        <ExerciseMediaPlaceholder
          actionName={actionName}
          className={className}
        />
      )
    }

    return (
      <div className={`flex items-center justify-center px-4 py-2 text-center text-[13px] font-semibold text-primary-foreground/45 ${className || ""}`}>
        加载中...
      </div>
    )
  }

  const isVideo = Boolean(media?.video_url) || /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl)

  if (isVideo) {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`${fit === "contain" ? "object-contain" : "object-cover"} w-full h-full ${className || ""}`}
        src={mediaUrl}
      />
    )
  }

  return (
    <img
      src={mediaUrl}
      alt={media?.exercise_name ?? actionName}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} w-full h-full ${className || ""}`}
      draggable={false}
    />
  )
}

function ExerciseMediaPlaceholder({
  actionName,
  className,
}: {
  actionName: string
  className?: string
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-muted px-4 text-center text-muted-foreground ${className || ""}`}
      aria-label={`${actionName} 暂无动作图片`}
    >
      <span className="text-xs font-medium">暂无动作图</span>
      <span className="line-clamp-2 text-xs">{actionName}</span>
    </div>
  )
}
