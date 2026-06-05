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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

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

            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>食物</TableHead>
                    <TableHead className="w-28 text-right">吃了多少</TableHead>
                    <TableHead className="w-28 text-right">热量</TableHead>
                    <TableHead className="w-24 text-right">蛋白质</TableHead>
                    <TableHead className="w-24 text-right">脂肪</TableHead>
                    <TableHead className="w-24 text-right">碳水</TableHead>
                    <TableHead className="w-24 text-right">置信度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length ? (
                    items.map((item, index) => (
                      <TableRow key={`${item.name}-${index}`}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={(checked) =>
                              updateItem(index, { selected: checked === true })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.name || "未知食物"}</span>
                            {item.assumptions.length ? (
                              <span className="max-w-64 text-xs text-muted-foreground">
                                {item.assumptions.join("；")}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <EditableNumberCell
                          suffix="g"
                          value={item.estimated_weight_g}
                          onChange={(value) => updateWeight(index, value)}
                        />
                        <EditableNumberCell
                          suffix="kcal"
                          value={item.estimated_kcal}
                          onChange={(value) => updateItem(index, { estimated_kcal: value })}
                        />
                        <EditableNumberCell
                          suffix="g"
                          value={item.protein_g}
                          onChange={(value) => updateItem(index, { protein_g: value })}
                        />
                        <EditableNumberCell
                          suffix="g"
                          value={item.fat_g}
                          onChange={(value) => updateItem(index, { fat_g: value })}
                        />
                        <EditableNumberCell
                          suffix="g"
                          value={item.carbs_g}
                          onChange={(value) => updateItem(index, { carbs_g: value })}
                        />
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {Math.round(item.confidence * 100)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="py-8 text-center text-muted-foreground" colSpan={8}>
                        未识别到明确食物
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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

function EditableNumberCell({
  onChange,
  suffix,
  value,
}: {
  onChange: (value: number) => void
  suffix: string
  value: number
}) {
  return (
    <TableCell className="text-right">
      <div className="ml-auto flex w-24 items-center gap-1">
        <Input
          className="h-7 text-right"
          min={0}
          onChange={(event) => onChange(toNumber(event.target.value))}
          type="number"
          value={String(value)}
        />
        <span className="w-8 shrink-0 text-left text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </TableCell>
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
  return items.map(({ selected: _selected, ...item }) => item)
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
