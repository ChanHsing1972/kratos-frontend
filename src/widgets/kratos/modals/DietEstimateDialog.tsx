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
import {
  Card,
  CardContent,
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
          <DialogDescription>
            勾选要保存的食物，必要时修正重量和营养估算。
          </DialogDescription>
        </DialogHeader>

        {estimate ? (
          <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryMetric label="将保存热量" value={total.estimated_kcal} unit="kcal" />
              <SummaryMetric label="蛋白质" value={total.protein_g} unit="g" />
              <SummaryMetric label="脂肪" value={total.fat_g} unit="g" />
              <SummaryMetric label="碳水" value={total.carbs_g} unit="g" />
            </div>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>识别到的食物</span>
                  <Badge variant="secondary">{selectedItems.length}/{items.length} 已选择</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemGroup data-size="sm">
                  {items.length ? (
                    items.map((item, index) => (
                      <EstimateItemCard
                        item={item}
                        key={`${item.name}-${index}`}
                        onCheckedChange={(checked) =>
                          updateItem(index, { selected: checked })
                        }
                        onMacroChange={(patch) => updateItem(index, patch)}
                        onWeightChange={(value) => updateWeight(index, value)}
                      />
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      未识别到明确食物
                    </p>
                  )}
                </ItemGroup>
              </CardContent>
            </Card>

            {estimate.warning ? (
              <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                {estimate.warning}
              </p>
            ) : null}
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
    <Item size="sm" variant="outline" className={item.selected ? "" : "opacity-60"}>
      <ItemMedia>
        <Checkbox
          checked={item.selected}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
        />
      </ItemMedia>

      <ItemContent>
        <ItemTitle>
          {item.name || "未知食物"}
          <Badge className="ml-2" variant="outline">
            {Math.round(item.confidence * 100)}%
          </Badge>
        </ItemTitle>
        <ItemDescription>
          约 {formatNumber(item.estimated_kcal)} kcal
          {item.assumptions.length ? ` · ${item.assumptions.join("；")}` : ""}
        </ItemDescription>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <MacroInput
            label="重量"
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
      </ItemContent>
    </Item>
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
    <label className="grid gap-1.5 rounded-lg border bg-background px-3 py-2">
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
    <Card size="sm">
      <CardContent className="py-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-lg font-semibold">
          {formatNumber(value)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
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
