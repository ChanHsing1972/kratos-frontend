import type { ComponentProps } from "react"
import { CircleAlert } from "lucide-react"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import { Field } from "@/shared/ui/field"
import { Textarea } from "@/shared/ui/textarea"
import { Button } from "@/shared/ui/button"

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
    <Field>
      <Label>{label}</Label>
      <Input
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
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
    <Field>
      <Label>{label}</Label>
      <Textarea
      className="min-h-[80px]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
  )
}

export function SuggestionChips({
  onSelect,
  options,
}: {
  label: string
  onSelect: (value: string) => void
  options: string[]
}) {
  return (
    <Field>
      <div className="flex flex-wrap gap-2 -mt-3">
        {options.map((option) => (
          <Button
            className="border border-border rounded-full text-left text-[12px] font-normal text-muted-foreground "
            key={option}
            onClick={() => onSelect(option)}
            type="button"
            variant="outline"
          >
            {option}
          </Button>
        ))}
      </div>
    </Field>
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