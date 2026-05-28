import type { TrainingExerciseMedia } from "@/entities/kratos/model/types"

import { useExerciseMedia } from "../hooks/useExerciseMedia"

export function ActionImage({
  actionName,
  className,
  media: embeddedMedia,
}: {
  actionName: string
  className?: string
  media?: TrainingExerciseMedia | null
}) {
  const { media: fetchedMedia, mediaUrl: fetchedMediaUrl, loading } = useExerciseMedia(actionName)
  const media = embeddedMedia?.media_url ? embeddedMedia : fetchedMedia
  const mediaUrl = media?.media_url ?? fetchedMediaUrl

  if (!mediaUrl) {
    return (
      <div className={`flex items-center justify-center px-4 py-2 text-center text-[13px] font-semibold text-primary-foreground/45 ${className || ""}`}>
        {loading ? "加载中..." : "暂无动作图片"}
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
        className={`object-cover w-full h-full ${className || ''}`}
        src={mediaUrl}
      />
    )
  }

  return (
    <img
      src={mediaUrl}
      alt={media?.exercise_name ?? actionName}
      className={`object-cover w-full h-full ${className || ''}`}
      draggable={false}
    />
  )
}
