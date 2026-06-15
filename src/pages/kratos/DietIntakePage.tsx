import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { Camera, Plus, Sparkles, Utensils, type LucideIcon } from "lucide-react"

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination"
import { Progress } from "@/shared/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

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
  const [activeFilter, setActiveFilter] = useState<"today" | "all" | "protein" | "estimated">("today")
  const todayRecords = useMemo(
    () => records.filter((record) => isToday(record.meal_date)),
    [records]
  )
  const todayTotal = totalFromRecords(todayRecords)
  const recentRecords = useMemo(
    () => [...records].sort(
      (left, right) =>
        dateTime(right.meal_date || right.created_at) -
        dateTime(left.meal_date || left.created_at)
    ),
    [records]
  )
  const filteredRecords = useMemo(
    () => filterRecords(recentRecords, activeFilter),
    [activeFilter, recentRecords]
  )
  const macroSplit = macroSplitFromTotal(todayTotal)
  const insights = buildInsights(todayRecords, recentRecords, todayTotal)

  const pageSize = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage]
  )

  useEffect(() => {
    setPage(1)
  }, [activeFilter])

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col px-6 pt-8 pb-16 sm:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-medium">饮食摄入</h1>
          </div>
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

        <section className="mt-10">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-4">
            <SummaryMetric label="今日热量" unit="kcal" value={todayTotal.kcal} />
            <SummaryMetric label="蛋白质" unit="g" value={todayTotal.protein} />
            <SummaryMetric label="脂肪" unit="g" value={todayTotal.fat} />
            <SummaryMetric label="碳水" unit="g" value={todayTotal.carbs} />
          </div>


          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-medium">今日结构</h2>
                <Badge variant="outline">{macroSplit.totalMacroKcal ? "已估算" : "待记录"}</Badge>
              </div>
              <div className="mt-5 grid gap-4">
                {macroSplit.items.map((item) => (
                  <MacroProgressRow key={item.label} {...item} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-medium">下一步</h2>
              {insights.length ? (
                <div className="mt-1 divide-y">
                  {insights.map((item) => (
                    <p className="py-3 text-sm leading-6 text-muted-foreground" key={item}>
                      {item}
                    </p>
                  ))}
                </div>
              ) : (
                <Empty className="mt-4 min-h-40 border border-dashed bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Sparkles />
                    </EmptyMedia>
                    <EmptyTitle>暂无建议</EmptyTitle>
                    <EmptyDescription>记录今天的餐食后，Kratos 会根据热量、蛋白质和来源给出下一步建议。</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-xl font-medium">饮食记录</h2>
              <TabsList aria-label="饮食记录筛选" variant="line">
                <TabsTrigger value="today">今日</TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="estimated">图片估算</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent className="mt-4" value={activeFilter}>
              {filteredRecords.length ? (
                <div>
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32 whitespace-nowrap">日期</TableHead>
                        <TableHead className="w-[360px] whitespace-nowrap">食物</TableHead>
                        <TableHead className="w-24 whitespace-nowrap text-right">重量</TableHead>
                        <TableHead className="w-24 whitespace-nowrap text-right">热量</TableHead>
                        <TableHead className="w-24 whitespace-nowrap text-right">蛋白质</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-right">脂肪</TableHead>
                        <TableHead className="w-20 whitespace-nowrap text-right">碳水</TableHead>
                        <TableHead className="w-28 whitespace-nowrap text-right">来源</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap align-middle">{formatDate(record.meal_date)}</TableCell>
                          <TableCell className="align-middle font-medium">
                            <span className="line-clamp-2 break-words leading-6">{record.name}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">{formatNumber(record.estimated_weight_g)}g</TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">{formatNumber(record.estimated_kcal)} kcal</TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">{formatNumber(record.protein_g)}g</TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">{formatNumber(record.fat_g)}g</TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">{formatNumber(record.carbs_g)}g</TableCell>
                          <TableCell className="whitespace-nowrap text-right align-middle">
                            <Badge variant="outline">{formatSource(record.source)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalPages > 1 ? (
                    <Pagination className="mt-4 justify-center">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            aria-disabled={safePage <= 1}
                            className={safePage <= 1 ? "pointer-events-none opacity-50" : undefined}
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              setPage((current) => Math.max(1, current - 1))
                            }}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              href="#"
                              isActive={pageNumber === safePage}
                              onClick={(event) => {
                                event.preventDefault()
                                setPage(pageNumber)
                              }}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            aria-disabled={safePage >= totalPages}
                            className={safePage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              setPage((current) => Math.min(totalPages, current + 1))
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  ) : null}
                </div>
              ) : (
                <Empty className="min-h-64 border border-dashed bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Utensils />
                    </EmptyMedia>
                    <EmptyTitle>{records.length ? "这个筛选下没有记录" : "暂无饮食记录"}</EmptyTitle>
                    <EmptyDescription>
                      {records.length ? "切换到全部记录，或继续补充今天的餐食。" : "手动添加或上传餐食图片后，这里会显示摄入明细。"}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </section>
    </main>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  unit,
  value,
}: {
  icon?: LucideIcon
  label: string
  unit: string
  value: number
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium tracking-tight">
        {formatNumber(value)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}

function MacroProgressRow({
  grams,
  label,
  percent,
}: {
  grams: number
  label: string
  percent: number
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {formatNumber(grams)}g · {formatNumber(percent)}%
        </span>
      </div>
      <Progress value={percent} />
    </div>
  )
}

function filterRecords(records: DietRecord[], filter: "today" | "all" | "protein" | "estimated") {
  if (filter === "today") {
    return records.filter((record) => isToday(record.meal_date))
  }
  if (filter === "protein") {
    return records.filter((record) => proteinDensity(record) < 5 && record.estimated_kcal >= 80)
  }
  if (filter === "estimated") {
    return records.filter((record) => record.source === "ai_estimated")
  }
  return records
}

function macroSplitFromTotal(total: ReturnType<typeof totalFromRecords>) {
  const proteinKcal = total.protein * 4
  const carbsKcal = total.carbs * 4
  const fatKcal = total.fat * 9
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal
  return {
    totalMacroKcal,
    items: [
      { grams: total.protein, label: "蛋白质", percent: percentOf(proteinKcal, totalMacroKcal) },
      { grams: total.fat, label: "脂肪", percent: percentOf(fatKcal, totalMacroKcal) },
      { grams: total.carbs, label: "碳水", percent: percentOf(carbsKcal, totalMacroKcal) },
    ],
  }
}

function buildInsights(todayRecords: DietRecord[], recentRecords: DietRecord[], total: ReturnType<typeof totalFromRecords>) {
  if (!todayRecords.length) {
    return []
  }

  const insights = [`今天已记录 ${todayRecords.length} 项，合计约 ${formatNumber(total.kcal)} kcal。`]
  const proteinPer100Kcal = total.kcal > 0 ? (total.protein / total.kcal) * 100 : 0
  if (proteinPer100Kcal < 5) {
    insights.push("今天蛋白密度偏低。下一餐优先补充鸡蛋、鱼虾、牛奶、豆制品或瘦肉。")
  } else {
    insights.push("今天蛋白密度还不错，继续把蛋白分散到每餐会更稳。")
  }

  const estimatedCount = todayRecords.filter((record) => record.source === "ai_estimated").length
  if (estimatedCount) {
    insights.push(`有 ${estimatedCount} 项来自图片估算，份量不确定时建议手动微调重量。`)
  }

  const topProtein = [...recentRecords].sort((left, right) => right.protein_g - left.protein_g)[0]
  if (topProtein?.protein_g) {
    insights.push(`近期蛋白贡献最高的是 ${topProtein.name}，约 ${formatNumber(topProtein.protein_g)}g。`)
  }
  return insights.slice(0, 4)
}

function totalFromRecords(records: DietRecord[]) {
  return {
    carbs: roundOne(records.reduce((sum, record) => sum + record.carbs_g, 0)),
    fat: roundOne(records.reduce((sum, record) => sum + record.fat_g, 0)),
    kcal: roundOne(records.reduce((sum, record) => sum + record.estimated_kcal, 0)),
    protein: roundOne(records.reduce((sum, record) => sum + record.protein_g, 0)),
  }
}

function proteinDensity(record: DietRecord) {
  return record.estimated_kcal > 0 ? (record.protein_g / record.estimated_kcal) * 100 : 0
}

function percentOf(value: number, total: number) {
  if (!total) return 0
  return roundOne((value / total) * 100)
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
