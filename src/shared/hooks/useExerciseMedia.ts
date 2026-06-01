import { useEffect, useState } from "react"
import { getExerciseMedia, AUTH_TOKEN_KEY, type ExerciseMediaResponse } from "../../entities/kratos/api/client"

const mediaCache = new Map<string, ExerciseMediaResponse | null>()
const mediaRequests = new Map<string, Promise<ExerciseMediaResponse>>()

export function useExerciseMedia(actionName: string) {
  const normalizedInitialName = actionName.trim()
  const cached = mediaCache.get(normalizedInitialName)
  const [media, setMedia] = useState<ExerciseMediaResponse | null>(cached ?? null)
  const [loading, setLoading] = useState(!mediaCache.has(normalizedInitialName))

  useEffect(() => {
    const normalizedName = actionName.trim()
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    let isMounted = true
    const cleanup = () => {
      isMounted = false
    }

    const updateMediaState = (
      nextMedia: ExerciseMediaResponse | null,
      nextLoading: boolean
    ) => {
      queueMicrotask(() => {
        if (isMounted) {
          setMedia(nextMedia)
          setLoading(nextLoading)
        }
      })
    }

    if (!normalizedName) {
      updateMediaState(null, false)
      return cleanup
    }

    if (mediaCache.has(normalizedName)) {
      updateMediaState(mediaCache.get(normalizedName) ?? null, false)
      return cleanup
    }

    updateMediaState(null, true)

    let request = mediaRequests.get(normalizedName)
    if (!request) {
      request = getExerciseMedia(normalizedName, token)
      mediaRequests.set(normalizedName, request)
    }

    request
      .then((data) => {
        if (isMounted) {
          mediaCache.set(normalizedName, data)
          setMedia(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          mediaCache.set(normalizedName, null)
          setMedia(null)
        }
      })
      .finally(() => {
        mediaRequests.delete(normalizedName)
        if (isMounted) {
          setLoading(false)
        }
      })

    return cleanup
  }, [actionName])

  return { media, mediaUrl: media?.media_url ?? null, loading }
}
