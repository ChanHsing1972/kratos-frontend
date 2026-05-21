import { useEffect, useState } from "react"
import { getExerciseMedia, AUTH_TOKEN_KEY, type ExerciseMediaResponse } from "../../entities/kratos/api/client"

const mediaCache = new Map<string, ExerciseMediaResponse | null>()

export function useExerciseMedia(actionName: string) {
  const cached = mediaCache.get(actionName)
  const [media, setMedia] = useState<ExerciseMediaResponse | null>(cached ?? null)
  const [loading, setLoading] = useState(!mediaCache.has(actionName))

  useEffect(() => {
    const normalizedName = actionName.trim()
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!normalizedName) {
      setMedia(null)
      setLoading(false)
      return
    }

    if (mediaCache.has(normalizedName)) {
      setMedia(mediaCache.get(normalizedName) ?? null)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    getExerciseMedia(normalizedName, token)
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
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [actionName])

  return { media, mediaUrl: media?.media_url ?? null, loading }
}
