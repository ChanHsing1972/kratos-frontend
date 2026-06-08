import { Check, Utensils } from "lucide-react"

import type { FoodImageEstimateResult } from "@/entities/kratos/model/types"

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

    return (
        <section className="mt-4 rounded-[12px] border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
                <Utensils className="mt-0.5 size-5 shrink-0 text-orange-500" />
                <div>
                    <h4 className="text-[14px] font-bold">确认饮食记录</h4>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                        我通过图片估算了以下食物热量，确认后将保存到今日饮食记录。
                    </p>
                </div>
            </div>
            <div className="mt-3 space-y-2">
                {items.map((item, index) => (
                    <div
                        className="flex items-center justify-between gap-2 rounded-[8px] border bg-card px-3 py-2"
                        key={`${item.name}-${index}`}
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold truncate">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                                约 {item.estimated_weight_g}g
                                {item.confidence < 0.7 ? " · 低置信度" : ""}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[13px] font-bold tabular-nums">
                                {item.estimated_kcal}{" "}
                                <span className="text-[11px] font-normal text-muted-foreground">kcal</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                                蛋白质 {item.protein_g}g
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-[8px] border bg-card px-3 py-2">
                <span className="text-[12px] font-semibold text-muted-foreground">合计</span>
                <div className="flex items-center gap-3 text-[12px]">
                    <span className="tabular-nums">
                        <span className="font-bold">{total.estimated_kcal}</span> kcal
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                        蛋白质 {total.protein_g}g
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                        脂肪 {total.fat_g}g
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                        碳水 {total.carbs_g}g
                    </span>
                </div>
            </div>
            {data.warning ? (
                <p className="mt-2 text-[11px] leading-4 text-amber-600">{data.warning}</p>
            ) : null}
            <button
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary px-3 text-[12px] font-bold text-primary-foreground disabled:opacity-50"
                disabled={loading || saved}
                onClick={onConfirm}
                type="button"
            >
                {saved ? <Check className="size-3.5" /> : null}
                {saved ? "已保存" : loading ? "保存中..." : "确认并保存"}
            </button>
        </section>
    )
}