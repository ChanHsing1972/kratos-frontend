export const WEEKDAY_OPTIONS = [
    "周一",
    "周二",
    "周三",
    "周四",
    "周五",
    "周六",
    "周日",
] as const

export type Weekday = (typeof WEEKDAY_OPTIONS)[number]

export type TrainingPlanWeeklyScheduleAction = {
    id: string
    name: string
    amount: string
    note: string
}

export type TrainingPlanWeeklyScheduleDay = {
    id: string
    weekday: Weekday
    theme: string
    actions: TrainingPlanWeeklyScheduleAction[]
}

export function createTrainingPlanWeeklyScheduleDay(
    weekday: Weekday = WEEKDAY_OPTIONS[0]
): TrainingPlanWeeklyScheduleDay {
    return {
        id: createScheduleId(),
        weekday,
        theme: "",
        actions: [createTrainingPlanWeeklyScheduleAction()],
    }
}

export function createTrainingPlanWeeklyScheduleAction(): TrainingPlanWeeklyScheduleAction {
    return {
        id: createScheduleId(),
        name: "",
        amount: "",
        note: "",
    }
}

export function parseTrainingPlanWeeklySchedule(
    value: string
): TrainingPlanWeeklyScheduleDay[] {
    const parsedDays = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(parseTrainingPlanWeeklyScheduleLine)
        .filter(
            (
                day
            ): day is TrainingPlanWeeklyScheduleDay => day !== null
        )

    return parsedDays.length ? parsedDays : [createTrainingPlanWeeklyScheduleDay()]
}

export function serializeTrainingPlanWeeklySchedule(
    days: TrainingPlanWeeklyScheduleDay[]
) {
    return days
        .map((day) => {
            const theme = day.theme.trim()
            const actions = day.actions
                .map(serializeTrainingPlanWeeklyScheduleAction)
                .filter(Boolean)

            if (!theme || !actions.length) {
                return ""
            }

            return `${day.weekday}｜${theme}：${actions.join("；")}`
        })
        .filter(Boolean)
        .join("\n")
}

function parseTrainingPlanWeeklyScheduleLine(
    line: string
): TrainingPlanWeeklyScheduleDay | null {
    const separatorIndex = line.indexOf("｜") >= 0 ? line.indexOf("｜") : line.indexOf("|")
    if (separatorIndex < 0) {
        return null
    }

    const colonIndex =
        line.indexOf("：", separatorIndex + 1) >= 0
            ? line.indexOf("：", separatorIndex + 1)
            : line.indexOf(":", separatorIndex + 1)

    if (colonIndex < 0) {
        return null
    }

    const weekday = normalizeWeekday(line.slice(0, separatorIndex).trim())
    const theme = line.slice(separatorIndex + 1, colonIndex).trim()
    const actionText = line.slice(colonIndex + 1).trim()
    const actions = actionText
        ? actionText
            .split(/[；;]+/)
            .map((segment) => segment.trim())
            .filter(Boolean)
            .map(parseTrainingPlanWeeklyScheduleAction)
        : []

    if (actions.length === 0 || actions[actions.length - 1].name !== "" || actions[actions.length - 1].amount !== "") {
        actions.push(createTrainingPlanWeeklyScheduleAction())
    }

    return {
        id: createScheduleId(),
        weekday,
        theme,
        actions,
    }
}

function parseTrainingPlanWeeklyScheduleAction(
    value: string
): TrainingPlanWeeklyScheduleAction {
    const trimmed = value.trim()
    const noteMatch = trimmed.match(/^(.*?)[（(]([^（）()]*)[）)]$/)
    const body = noteMatch ? noteMatch[1].trim() : trimmed
    const note = noteMatch ? noteMatch[2].trim() : ""
    const separatorIndex = body.search(/\s/)

    if (separatorIndex < 0) {
        return {
            id: createScheduleId(),
            name: body,
            amount: "",
            note,
        }
    }

    return {
        id: createScheduleId(),
        name: body.slice(0, separatorIndex).trim(),
        amount: body.slice(separatorIndex + 1).trim(),
        note,
    }
}

function serializeTrainingPlanWeeklyScheduleAction(
    action: TrainingPlanWeeklyScheduleAction
) {
    const name = action.name.trim()
    const amount = action.amount.trim()
    const note = action.note.trim()

    if (!name || !amount) {
        return ""
    }

    return `${name} ${amount}${note ? `（${note}）` : ""}`
}

function normalizeWeekday(value: string): Weekday {
    const matchedWeekday = WEEKDAY_OPTIONS.find((weekday) => weekday === value)
    return matchedWeekday ?? WEEKDAY_OPTIONS[0]
}

function createScheduleId() {
    const browserCrypto = globalThis.crypto

    if (typeof browserCrypto?.randomUUID === "function") {
        return browserCrypto.randomUUID()
    }

    if (typeof browserCrypto?.getRandomValues === "function") {
        const bytes = browserCrypto.getRandomValues(new Uint8Array(16))
        bytes[6] = (bytes[6] & 0x0f) | 0x40
        bytes[8] = (bytes[8] & 0x3f) | 0x80

        const hex = Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, "0")
        )

        return [
            hex.slice(0, 4).join(""),
            hex.slice(4, 6).join(""),
            hex.slice(6, 8).join(""),
            hex.slice(8, 10).join(""),
            hex.slice(10, 16).join(""),
        ].join("-")
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}