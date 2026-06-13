import { Check, Soup, Utensils } from "lucide-react"

import type { FoodImageEstimateResult } from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/shared/ui/item"
import { Skeleton } from "@/shared/ui/skeleton"
import { Spinner } from "@/shared/ui/spinner"

type DietRecordConfirmationCardProps = {
  data: FoodImageEstimateResult
  loading: boolean
  saved: boolean
  onConfirm: () => void
}

export function DietRecordConfirmationCard({
  data,
  loading,
  onConfirm,
  saved,
}: DietRecordConfirmationCardProps) {
  const { items, total } = data
  const visibleItems = items.slice(0, 7)
  const extraCount = Math.max(0, items.length - visibleItems.length)

  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="size-4" />
          确认饮食记录
        </CardTitle>
        <CardDescription>
          图片估算结果会在确认后保存到今日饮食记录。
        </CardDescription>
        <CardAction>
          <Badge variant={saved ? "default" : "secondary"}>
            {saved ? "已保存" : `${Math.round(total.estimated_kcal)} kcal`}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">

        <div className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-4">
          <Macro label="热量" unit="kcal" value={total.estimated_kcal} />
          <Macro label="蛋白质" unit="g" value={total.protein_g} />
          <Macro label="脂肪" unit="g" value={total.fat_g} />
          <Macro label="碳水" unit="g" value={total.carbs_g} />
        </div>

        <ItemGroup data-size="sm">
          {visibleItems.map((item, index) => (
            <Item key={`${item.name}-${index}`} size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Soup className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{item.name || "未知食物"}</ItemTitle>
                <ItemDescription>
                  约 {formatNumber(item.estimated_weight_g)}g · {formatNumber(item.estimated_kcal)} kcal
                  {item.confidence < 0.7 ? " · 低置信度" : ""}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>


        {extraCount ? (
          <p className="text-xs text-muted-foreground">
            另有 {extraCount} 项食物会一并保存。
          </p>
        ) : null}
        {data.warning ? (
          <p className="text-xs leading-5 text-muted-foreground">{data.warning}</p>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button disabled={loading || saved} onClick={onConfirm} type="button">
          {loading ? <Spinner /> : <Check className="size-4" />}
          {saved ? "已保存" : loading ? "保存中..." : "确认并保存"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export function DietRecordConfirmationCardSkeleton() {
  return (
    <Card className="mt-4" size="default">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
        <CardAction>
          <Skeleton className="h-5 w-20 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <ItemGroup data-size="sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <Item key={index} size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Skeleton className="size-4 rounded-full" />
              </ItemMedia>
              <ItemContent>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
        <Skeleton className="h-16 w-full" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  )
}

function Macro({
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
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium tabular-nums">
        {formatNumber(value)}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}
