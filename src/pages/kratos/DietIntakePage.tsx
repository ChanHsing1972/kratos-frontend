import type { ChangeEvent } from "react"
import { Camera, Plus, Utensils } from "lucide-react"

import type { DietRecord } from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

type DietIntakePageProps = {
  dietEstimating: boolean
  records: DietRecord[]
  onAddDiet: () => void
  onDietImage: (event: ChangeEvent<HTMLInputElement>) => void
}

export function DietIntakePage({
  dietEstimating,
  records,
  onAddDiet,
  onDietImage,
}: DietIntakePageProps) {
  const todayRecords = records.filter((record) => isToday(record.meal_date))
  const todayTotal = totalFromRecords(todayRecords)
  const recentRecords = [...records].sort(
    (left, right) =>
      dateTime(right.meal_date || right.created_at) -
      dateTime(left.meal_date || left.created_at)
  )

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-background">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col px-6 pt-8 pb-16 sm:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <h1 className="text-3xl font-medium tracking-[-0.04em]">饮食摄入</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onAddDiet} type="button" variant="outline">
              <Plus />
              手动添加
            </Button>
            <Button disabled={dietEstimating} type="button" variant="default" asChild>
              <label>
                <Camera />
                {dietEstimating ? "识别中" : "图片估算"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={onDietImage}
                  type="file"
                />
              </label>
            </Button>
          </div>
        </header>

        <div className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-4">
          <SummaryMetric label="今日热量" unit="kcal" value={todayTotal.kcal} />
          <SummaryMetric label="蛋白质" unit="g" value={todayTotal.protein} />
          <SummaryMetric label="脂肪" unit="g" value={todayTotal.fat} />
          <SummaryMetric label="碳水" unit="g" value={todayTotal.carbs} />
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-medium tracking-[-0.03em]">饮食记录</h2>
            {recentRecords.length ? (
              <div className="mt-4 overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>食物</TableHead>
                      <TableHead className="text-right">重量</TableHead>
                      <TableHead className="text-right">热量</TableHead>
                      <TableHead className="text-right">蛋白质</TableHead>
                      <TableHead className="text-right">脂肪</TableHead>
                      <TableHead className="text-right">碳水</TableHead>
                      <TableHead className="text-right">来源</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.meal_date)}</TableCell>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(record.estimated_weight_g)}g</TableCell>
                        <TableCell className="text-right">{formatNumber(record.estimated_kcal)} kcal</TableCell>
                        <TableCell className="text-right">{formatNumber(record.protein_g)}g</TableCell>
                        <TableCell className="text-right">{formatNumber(record.fat_g)}g</TableCell>
                        <TableCell className="text-right">{formatNumber(record.carbs_g)}g</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{formatSource(record.source)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Empty className="mt-4 min-h-64 bg-transparent">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Utensils />
                  </EmptyMedia>
                  <EmptyTitle>还没有饮食记录</EmptyTitle>
                  <EmptyDescription>
                    手动添加或上传餐食图片后，这里会显示摄入明细。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
        </section>
      </section>
    </main>
  )
}

function SummaryMetric({
  label,
  unit,
  value,
}: {
  label: string
  unit: string
  value: number
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight">
        {formatNumber(value)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}

function totalFromRecords(records: DietRecord[]) {
  return {
    carbs: roundOne(records.reduce((sum, record) => sum + record.carbs_g, 0)),
    fat: roundOne(records.reduce((sum, record) => sum + record.fat_g, 0)),
    kcal: roundOne(records.reduce((sum, record) => sum + record.estimated_kcal, 0)),
    protein: roundOne(records.reduce((sum, record) => sum + record.protein_g, 0)),
  }
}

function isToday(date: string) {
  return formatDate(date) === formatDate(new Date().toISOString())
}

function formatDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(0, 10)
  return `${parsed.getFullYear()}-${`${parsed.getMonth() + 1}`.padStart(2, "0")}-${`${parsed.getDate()}`.padStart(2, "0")}`
}

function dateTime(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function formatSource(source: string) {
  if (source === "manual") return "手动"
  if (source === "ai_estimated") return "图片估算"
  return source
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}
