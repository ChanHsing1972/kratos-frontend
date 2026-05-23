"use client"

import { Plus, Trash2 } from "lucide-react"

import { Field } from "@/shared/ui/field"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import {
    WEEKDAY_OPTIONS,
    createTrainingPlanWeeklyScheduleAction,
    createTrainingPlanWeeklyScheduleDay,
    type TrainingPlanWeeklyScheduleAction,
    type TrainingPlanWeeklyScheduleDay,
    type Weekday,
} from "./trainingPlanSchedule"
import { Label } from "@/shared/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"

type TrainingPlanScheduleEditorProps = {
    value: TrainingPlanWeeklyScheduleDay[]
    onChange: (value: TrainingPlanWeeklyScheduleDay[]) => void
}

export function TrainingPlanScheduleEditor({
    value,
    onChange,
}: TrainingPlanScheduleEditorProps) {
    const addDay = () => {
        onChange([
            ...value,
            createTrainingPlanWeeklyScheduleDay(
                WEEKDAY_OPTIONS[value.length % WEEKDAY_OPTIONS.length]
            ),
        ])
    }

    const updateDay = (
        dayId: string,
        updater: (day: TrainingPlanWeeklyScheduleDay) => TrainingPlanWeeklyScheduleDay
    ) => {
        onChange(
            value.map((day) => (day.id === dayId ? updater(day) : day))
        )
    }

    const removeDay = (dayId: string) => {
        const nextDays = value.filter((day) => day.id !== dayId)
        onChange(
            nextDays.length ? nextDays : [createTrainingPlanWeeklyScheduleDay()]
        )
    }

    return (
        <section className="grid gap-4">
            <div className="flex items-center justify-between">
                <Label>周训练安排</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDay}>
                    <Plus className="size-3.5" />
                    添加训练日
                </Button>
            </div>

            <div className="grid gap-6">
                {value.map((day, index) => (
                    <TrainingPlanScheduleDayCard
                        day={day}
                        index={index}
                        key={day.id}
                        onChange={(nextDay) => updateDay(day.id, () => nextDay)}
                        onChangeAction={(actionId, updater) => {
                            updateDay(day.id, (currentDay) => {
                                const nextActions = currentDay.actions.map((action) =>
                                    action.id === actionId ? updater(action) : action
                                )

                                const lastAction = nextActions[nextActions.length - 1]
                                if (lastAction && (lastAction.name || lastAction.amount || lastAction.note)) {
                                    nextActions.push(createTrainingPlanWeeklyScheduleAction())
                                }

                                return {
                                    ...currentDay,
                                    actions: nextActions,
                                }
                            })
                        }}
                        onRemoveAction={(actionId) => {
                            const nextActions = day.actions.filter(
                                (action) => action.id !== actionId
                            );
                            if (nextActions.length === 0) {
                                removeDay(day.id);
                            } else {
                                updateDay(day.id, (currentDay) => ({
                                    ...currentDay,
                                    actions: nextActions,
                                }));
                            }
                        }}
                    />
                ))}
            </div>
        </section>
    )
}

function TrainingPlanScheduleDayCard({
    day,
    index,
    onChange,
    onChangeAction,
    onRemoveAction,
}: {
    day: TrainingPlanWeeklyScheduleDay
    index: number
    onChange: (day: TrainingPlanWeeklyScheduleDay) => void
    onChangeAction: (
        actionId: string,
        updater: (action: TrainingPlanWeeklyScheduleAction) => TrainingPlanWeeklyScheduleAction
    ) => void
    onRemoveAction: (actionId: string) => void
}) {
    return (
        <article className="grid gap-0">
            <div className="flex items-center justify-between mb-2">
                <Label>训练日 {index + 1}</Label>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="h-10 px-0 text-muted-foreground">星期</TableHead>
                            <TableHead className="h-10 px-0 text-muted-foreground">训练主题</TableHead>
                            <TableHead className="h-10 px-0 text-muted-foreground">动作名称</TableHead>
                            <TableHead className="h-10 px-0 text-muted-foreground">训练量</TableHead>
                            <TableHead className="h-10 px-0 text-muted-foreground">备注</TableHead>
                            <TableHead className="h-10 text-right" />
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {day.actions.map((action, actionIndex) => {
                            const isFirstAction = actionIndex === 0

                            return (
                                <TableRow
                                    className="border-b border-border/60 last:border-b"
                                    key={action.id}
                                >
                                    <TableCell className="px-0 py-3 pr-3 align-top">
                                        {isFirstAction ? (
                                            <Field>
                                                <Select
                                                    value={day.weekday}
                                                    onValueChange={(value) =>
                                                        onChange({
                                                            ...day,
                                                            weekday: value as Weekday,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id={`weekday-${day.id}`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {WEEKDAY_OPTIONS.map((weekday) => (
                                                                <SelectItem key={weekday} value={weekday}>
                                                                    {weekday}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </Field>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="px-0 py-3 pr-3 align-top">
                                        {isFirstAction ? (
                                            <Field>
                                                <Input
                                                    id={`theme-${day.id}`}
                                                    maxLength={120}
                                                    onChange={(event) =>
                                                        onChange({ ...day, theme: event.target.value })
                                                    }
                                                    placeholder="训练主题"
                                                    required
                                                    value={day.theme}
                                                />
                                            </Field>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="px-0 py-3 pr-3 align-top">
                                        <Input
                                            aria-label={`训练日 ${index + 1} 第 ${actionIndex + 1} 个动作名称`}
                                            maxLength={120}
                                            onChange={(event) =>
                                                onChangeAction(action.id, (currentAction) => ({
                                                    ...currentAction,
                                                    name: event.target.value,
                                                }))
                                            }
                                            placeholder="动作名称"
                                            value={action.name}
                                        />
                                    </TableCell>
                                    <TableCell className="px-0 py-3 pr-3 align-top">
                                        <Input
                                            aria-label={`训练日 ${index + 1} 第 ${actionIndex + 1} 个动作量`}
                                            maxLength={120}
                                            onChange={(event) =>
                                                onChangeAction(action.id, (currentAction) => ({
                                                    ...currentAction,
                                                    amount: event.target.value,
                                                }))
                                            }
                                            placeholder="4 组 x 8 次"
                                            value={action.amount}
                                        />
                                    </TableCell>
                                    <TableCell className="px-0 py-3 align-top">
                                        <Input
                                            aria-label={`训练日 ${index + 1} 第 ${actionIndex + 1} 个动作备注`}
                                            maxLength={120}
                                            onChange={(event) =>
                                                onChangeAction(action.id, (currentAction) => ({
                                                    ...currentAction,
                                                    note: event.target.value,
                                                }))
                                            }
                                            placeholder="可选备注"
                                            value={action.note}
                                        />
                                    </TableCell>
                                    <TableCell className="px-2 text-right align-top">
                                        <Button
                                            aria-label={`删除训练日 ${index + 1} 第 ${actionIndex + 1} 个动作`}
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => onRemoveAction(action.id)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </article>
    )
}