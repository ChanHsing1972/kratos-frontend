import type { ComponentProps } from "react"
import { CircleAlert } from "lucide-react"

export function FormInput({
  label,
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<"input">, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-foreground">{label}</span>
      <input
        className="mt-2 h-10 w-full rounded-[10px] border border-border bg-card px-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  )
}

export function FormTextarea({
  label,
  onChange,
  value,
  ...props
}: {
  label: string
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<"textarea">, "onChange" | "value">) {
  return (
    <label className="mt-3 block">
      <span className="text-[12px] font-bold text-foreground">{label}</span>
      <textarea
        className="mt-2 min-h-20 w-full resize-none rounded-[10px] border border-border bg-card px-3 py-2 text-[13px] leading-5 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  )
}

export function SuggestionChips({
  label,
  onSelect,
  options,
}: {
  label: string
  onSelect: (value: string) => void
  options: string[]
}) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className="rounded-[8px] border border-border bg-card px-3 py-1.5 text-left text-[11px] font-bold text-muted-foreground shadow-[0_6px_14px_rgba(0,0,0,0.06)] hover:border-primary hover:bg-muted"
            key={option}
            onClick={() => onSelect(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-destructive/10 p-3 text-[12px] leading-5 text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
