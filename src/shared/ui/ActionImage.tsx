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
  const { media: fetchedMedia, mediaUrl: fetchedMediaUrl, loading } = useExerciseMedia(actionName)
  const media = embeddedMedia?.media_url ? embeddedMedia : fetchedMedia
  const mediaUrl = media?.media_url ?? fetchedMediaUrl

  if (!mediaUrl) {
    if (!loading) {
      return (
        <ExerciseFallbackIllustration
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

function ExerciseFallbackIllustration({
  actionName,
  className,
}: {
  actionName: string
  className?: string
}) {
  const pose = fallbackPose(actionName)

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#111827] ${className || ""}`}
      aria-label={`${actionName} 动作示意图`}
      role="img"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 160 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect fill="#111827" height="120" width="160" />
        <path d="M20 96H140" stroke="#374151" strokeLinecap="round" strokeWidth="3" />
        {pose === "floor" ? (
          <>
            <circle cx="60" cy="55" fill="#F9FAFB" r="9" />
            <path d="M69 62C82 69 95 68 110 62" stroke="#F9FAFB" strokeLinecap="round" strokeWidth="7" />
            <path d="M80 69L64 88" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
            <path d="M88 70L106 90" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
            <path d="M88 65L75 43" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
            <path d="M98 65L120 48" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
          </>
        ) : pose === "pull" ? (
          <>
            <path d="M45 30H115" stroke="#9CA3AF" strokeLinecap="round" strokeWidth="5" />
            <circle cx="80" cy="46" fill="#F9FAFB" r="9" />
            <path d="M80 55L80 82" stroke="#F9FAFB" strokeLinecap="round" strokeWidth="8" />
            <path d="M80 58L58 36" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
            <path d="M80 58L102 36" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
            <path d="M78 82L62 101" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
            <path d="M82 82L100 101" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
          </>
        ) : (
          <>
            <circle cx="80" cy="32" fill="#F9FAFB" r="9" />
            <path d="M80 42L80 70" stroke="#F9FAFB" strokeLinecap="round" strokeWidth="8" />
            <path d="M80 48L58 63" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
            <path d="M80 48L102 63" stroke="#34D399" strokeLinecap="round" strokeWidth="6" />
            <path d="M79 70L62 96" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
            <path d="M82 70L101 96" stroke="#60A5FA" strokeLinecap="round" strokeWidth="7" />
          </>
        )}
        <text
          fill="#E5E7EB"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          x="80"
          y="114"
        >
          {actionName.slice(0, 10)}
        </text>
      </svg>
    </div>
  )
}

function fallbackPose(actionName: string) {
  if (/(死虫|平板|支撑|臀桥|拉伸|桥)/.test(actionName)) {
    return "floor"
  }
  if (/(划船|下拉|引体|面拉|拉)/.test(actionName)) {
    return "pull"
  }
  return "standing"
}
