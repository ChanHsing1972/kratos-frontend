import { useEffect, useState } from "react"

import {
  getCurrentHyperateHeartRate,
  saveWorkoutHeartRateSample,
} from "@/entities/kratos/api/client"

export type LiveHeartRateStatus =
  | "idle"
  | "connecting"
  | "live"
  | "no_data"
  | "disconnected"
  | "unbound"

export type LiveHeartRateState = {
  bpm: number | null
  detail: string | null
  recordedAt: string | null
  source: string
  status: LiveHeartRateStatus
}

type UseLiveHeartRateOptions = {
  enabled: boolean
  hasHyperateId: boolean
  intervalMs?: number
  token: string | null
  workoutSessionId: number | null
}

const IDLE_READING: LiveHeartRateState = {
  bpm: null,
  detail: null,
  recordedAt: null,
  source: "hyperate",
  status: "idle",
}

// Polls through the backend so HypeRate failures remain isolated from training.
export function useLiveHeartRate({
  enabled,
  hasHyperateId,
  intervalMs = 1000,
  token,
  workoutSessionId,
}: UseLiveHeartRateOptions) {
  const [reading, setReading] = useState<LiveHeartRateState>(IDLE_READING)

  useEffect(() => {
    if (!enabled) {
      setReading(IDLE_READING)
      return undefined
    }

    if (!hasHyperateId) {
      setReading({
        ...IDLE_READING,
        detail: "当前账号未绑定 HypeRate ID",
        status: "unbound",
      })
      return undefined
    }

    if (!token || !workoutSessionId) {
      setReading({
        ...IDLE_READING,
        detail: "训练 session 尚未准备好",
        status: "connecting",
      })
      return undefined
    }

    let cancelled = false
    let timeoutId: number | null = null
    let controller: AbortController | null = null

    const scheduleNextPoll = () => {
      if (cancelled) {
        return
      }
      timeoutId = window.setTimeout(pollHeartRate, intervalMs)
    }

    const pollHeartRate = async () => {
      controller?.abort()
      controller = new AbortController()
      setReading((current) =>
        current.status === "live"
          ? current
          : {
            ...current,
            status: "connecting",
          }
      )

      try {
        const current = await getCurrentHyperateHeartRate(
          token,
          controller.signal
        )
        if (cancelled) {
          return
        }

        const nextStatus = mapHyperateStatus(current.status)
        setReading({
          bpm: current.bpm,
          detail: current.detail ?? null,
          recordedAt: current.recorded_at,
          source: current.source,
          status: nextStatus,
        })

        if (current.status === "ok" && current.bpm) {
          await saveWorkoutHeartRateSample(
            token,
            workoutSessionId,
            {
              bpm: current.bpm,
              recorded_at: current.recorded_at,
              source: current.source,
            },
            controller.signal
          ).catch(() => null)
        }
      } catch (error) {
        if (!cancelled && !isAbortError(error)) {
          setReading((current) => ({
            ...current,
            detail: "心率连接中断",
            status: "disconnected",
          }))
        }
      } finally {
        scheduleNextPoll()
      }
    }

    void pollHeartRate()

    return () => {
      cancelled = true
      controller?.abort()
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [enabled, hasHyperateId, intervalMs, token, workoutSessionId])

  return reading
}

function mapHyperateStatus(status: string): LiveHeartRateStatus {
  if (status === "ok") return "live"
  if (status === "unbound") return "unbound"
  if (status === "no_data") return "no_data"
  return "disconnected"
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}
