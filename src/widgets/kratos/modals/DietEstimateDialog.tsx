import { useEffect, useMemo, useState } from "react"

import type {
  FoodEstimateItem,
  FoodImageEstimateResult,
} from "@/entities/kratos/model/types"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"

type EditableFoodEstimateItem = FoodEstimateItem & {
  selected: boolean
}

type DietEstimateDialogProps = {
  estimate: FoodImageEstimateResult | null
  open: boolean
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (items: FoodEstimateItem[]) => void
}

export function DietEstimateDialog({
  estimate,
  open,
  saving,
  onOpenChange,
  onSave,
}: DietEstimateDialogProps) {
  const [items, setItems] = useState<EditableFoodEstimateItem[]>([])

  useEffect(() => {
    if (!estimate) {
      setItems([])
      return
    }
    setItems(estimate.items.map((item) => ({ ...item, selected: true })))
  }, [estimate])

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items]
  )
  const total = useMemo(() => totalFromItems(selectedItems), [selectedItems])

  const canSave = selectedItems.length > 0 && !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[86svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>热量识别</DialogTitle>
          <DialogDescription>{estimate?.warning}</DialogDescription>
        </DialogHeader>

        {estimate ? (
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryMetric label="将保存热量" value={total.estimated_kcal} unit="kcal" />
              <SummaryMetric label="蛋白质" value={total.protein_g} unit="g" />
              <SummaryMetric label="脂肪" value={total.fat_g} unit="g" />
              <SummaryMetric label="碳水" value={total.carbs_g} unit="g" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <div className="text-sm font-medium">识别到的食物</div>
                  <div className="text-xs text-muted-foreground">
                    勾选需要保存的条目，也可以手动修正重量和营养估算。
                  </div>
                </div>
                <Badge variant="secondary">{selectedItems.length}/{items.length} 已选择</Badge>
              </div>

              {items.length ? (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <EstimateItemCard
                      item={item}
                      key={`${item.name}-${index}`}
                      onCheckedChange={(checked) =>
                        updateItem(index, { selected: checked })
                      }
                      onMacroChange={(patch) => updateItem(index, patch)}
                      onWeightChange={(value) => updateWeight(index, value)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  未识别到明确食物
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            暂不保存
          </Button>
          <Button disabled={!canSave} onClick={() => onSave(stripSelection(selectedItems))} type="button">
            {saving ? "保存中..." : "保存到今日饮食"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  function updateItem(index: number, patch: Partial<EditableFoodEstimateItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    )
  }

  function updateWeight(index: number, nextWeight: number) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }
        const previousWeight = item.estimated_weight_g || nextWeight || 1
        const ratio = previousWeight > 0 ? nextWeight / previousWeight : 1
        return {
          ...item,
          estimated_weight_g: nextWeight,
          estimated_kcal: roundOne(item.estimated_kcal * ratio),
          min_kcal: roundOne(item.min_kcal * ratio),
          max_kcal: roundOne(item.max_kcal * ratio),
          protein_g: roundOne(item.protein_g * ratio),
          fat_g: roundOne(item.fat_g * ratio),
          carbs_g: roundOne(item.carbs_g * ratio),
        }
      })
    )
  }
}

function EstimateItemCard({
  item,
  onCheckedChange,
  onMacroChange,
  onWeightChange,
}: {
  item: EditableFoodEstimateItem
  onCheckedChange: (checked: boolean) => void
  onMacroChange: (patch: Partial<EditableFoodEstimateItem>) => void
  onWeightChange: (value: number) => void
}) {
  return (
    <div
      className={
        item.selected
          ? "rounded-2xl border bg-card p-4 shadow-sm transition-colors"
          : "rounded-2xl border bg-muted/20 p-4 opacity-65 transition-colors"
      }
    >
      <div className="flex gap-3">
        <Checkbox
          checked={item.selected}
          className="mt-1"
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold tracking-tight">
                  {item.name || "未知食物"}
                </span>
                <Badge className="rounded-full" variant="outline">
                  置信度 {Math.round(item.confidence * 100)}%
                </Badge>
              </div>
              {item.assumptions.length ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {item.assumptions.join("；")}
                </p>
              ) : null}
            </div>

            <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              约 {formatNumber(item.estimated_kcal)} kcal
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MacroInput
              label="吃了多少"
              suffix="g"
              value={item.estimated_weight_g}
              onChange={onWeightChange}
            />
            <MacroInput
              label="热量"
              suffix="kcal"
              value={item.estimated_kcal}
              onChange={(value) => onMacroChange({ estimated_kcal: value })}
            />
            <MacroInput
              label="蛋白质"
              suffix="g"
              value={item.protein_g}
              onChange={(value) => onMacroChange({ protein_g: value })}
            />
            <MacroInput
              label="脂肪"
              suffix="g"
              value={item.fat_g}
              onChange={(value) => onMacroChange({ fat_g: value })}
            />
            <MacroInput
              label="碳水"
              suffix="g"
              value={item.carbs_g}
              onChange={(value) => onMacroChange({ carbs_g: value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MacroInput({
  label,
  onChange,
  suffix,
  value,
}: {
  label: string
  onChange: (value: number) => void
  suffix: string
  value: number
}) {
  return (
    <label className="grid gap-1.5 rounded-xl border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <Input
          className="h-8 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0"
          inputMode="decimal"
          onChange={(event) => onChange(toNumber(event.target.value))}
          value={String(value)}
        />
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {suffix}
        </span>
      </span>
    </label>
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
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">
        {formatNumber(value)}
        <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function totalFromItems(items: FoodEstimateItem[]) {
  return {
    estimated_kcal: roundOne(items.reduce((sum, item) => sum + item.estimated_kcal, 0)),
    protein_g: roundOne(items.reduce((sum, item) => sum + item.protein_g, 0)),
    fat_g: roundOne(items.reduce((sum, item) => sum + item.fat_g, 0)),
    carbs_g: roundOne(items.reduce((sum, item) => sum + item.carbs_g, 0)),
  }
}

function stripSelection(items: EditableFoodEstimateItem[]): FoodEstimateItem[] {
  return items.map(({ selected, ...item }) => {
    void selected
    return item
  })
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function roundOne(value: number) {
  return Math.max(0, Math.round(value * 10) / 10)
}

function toNumber(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}
