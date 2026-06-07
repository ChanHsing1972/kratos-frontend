import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { ArrowUp, Camera, Eye, ImageIcon, Loader2, Paperclip, PencilLine, Plus, Soup, Square, X } from "lucide-react"

import type { ChatAttachment } from "@/entities/kratos/model/types"
import { MarkdownMessage } from "@/widgets/kratos/conversation/MarkdownMessage"
import { Button } from "@/shared/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/shared/ui/input-group"
import { Separator } from "@/shared/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

type ConversationComposerProps = {
  attachments: ChatAttachment[]
  dietEstimating: boolean
  maxLength?: number
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onDietImage: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onRemoveAttachment: (index: number) => void
  onSend: () => void
  onStop: () => void
  sending: boolean
  value: string
}

export function ConversationComposer({
  attachments,
  dietEstimating,
  maxLength = 1000,
  onAttachment,
  onChange,
  onDietImage,
  onKeyDown,
  onRemoveAttachment,
  onSend,
  onStop,
  sending,
  value,
}: ConversationComposerProps) {
  const [mode, setMode] = useState<"write" | "preview">("write")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <InputGroup className="max-h-72 bg-background p-1 shadow-sm">
      <InputGroupAddon align="block-start" className="flex-wrap justify-start gap-2 pb-0">
        <TooltipProvider>
          <FloatingToolButton
            accept="image/*"
            disabled={sending}
            icon={<Camera className="size-3.5" />}
            label="图片识别"
            onChange={(event) => {
              if (!value.trim()) {
                onChange("请识别这张图片，并说明其中与训练、饮食或健康有关的信息。")
              }
              onAttachment(event)
            }}
            tooltip="上传图片给 Agent 识别"
          />
          <FloatingToolButton
            accept="image/jpeg,image/png,image/webp"
            disabled={sending || dietEstimating}
            icon={dietEstimating ? <Loader2 className="size-3.5 animate-spin" /> : <Soup className="size-3.5" />}
            label={dietEstimating ? "识别中" : "热量识别"}
            onChange={onDietImage}
            tooltip={dietEstimating ? "正在估算热量" : "上传食物图估算热量"}
          />
          <FloatingToolButton
            accept="image/*,.csv,.doc,.docx,.json,.pdf,.txt,.xls,.xlsx"
            disabled={sending}
            icon={<Paperclip className="size-3.5" />}
            label="上传附件"
            multiple
            onChange={onAttachment}
            tooltip="上传图片、文档或表格给 Agent"
          />
        </TooltipProvider>
      </InputGroupAddon>

      {attachments.length ? (
        <InputGroupAddon align="block-start" className="flex-wrap justify-start">
          {attachments.map((attachment, index) => (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-foreground"
              key={`${attachment.url}-${index}`}
            >
              {attachment.content_type.startsWith("image/") && attachment.data_url ? (
                <img
                  alt=""
                  className="size-5 rounded-sm object-cover"
                  src={attachment.data_url}
                />
              ) : attachment.content_type.startsWith("image/") ? (
                <ImageIcon className="size-3.5" />
              ) : (
                <Paperclip className="size-3.5" />
              )}
              <span className="max-w-40 truncate">{attachment.filename}</span>
              <button
                aria-label={`移除附件 ${attachment.filename}`}
                className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                onClick={() => onRemoveAttachment(index)}
                type="button"
              >
                <X />
              </button>
            </span>
          ))}
        </InputGroupAddon>
      ) : null}

      {mode === "write" ? (
        <InputGroupTextarea
          className="min-h-16 resize-none text-base disabled:opacity-100 md:text-sm"
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
          onCompositionEnd={(event) => {
            event.currentTarget.dataset.composing = "false"
          }}
          onCompositionStart={(event) => {
            event.currentTarget.dataset.composing = "true"
          }}
          onKeyDown={onKeyDown}
          placeholder={sending ? "Kratos 正在思考..." : "今天我想完成什么..."}
          ref={textareaRef}
          rows={1}
          value={value}
        />
      ) : (
        <div
          className="min-h-16 w-full px-2.5 py-1.5"
          data-slot="input-group-control"
        >
          {value.trim() ? (
            <MarkdownMessage className="text-sm leading-6 text-foreground">
              {value}
            </MarkdownMessage>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              没有预览的内容
            </p>
          )}
        </div>
      )}

      <InputGroupAddon align="block-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton
                aria-label="上传附件"
                asChild
                className="size-6 rounded-full p-0 shadow-none"
                type="button"
                variant="outline"
              >
                <label className="cursor-pointer">
                  <input
                    accept="image/*,.csv,.doc,.docx,.json,.pdf,.txt,.xls,.xlsx"
                    className="hidden"
                    multiple
                    onChange={onAttachment}
                    type="file"
                  />
                  <Plus className="size-3.5" />
                </label>
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent side="top">上传附件给 Agent</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ToggleGroup defaultValue="write" size="sm" type="single" variant="outline">
          <ToggleGroupItem onClick={() => setMode("write")} value="write">
            <PencilLine className="size-3.5" />
            编辑
          </ToggleGroupItem>
          <ToggleGroupItem onClick={() => setMode("preview")} value="preview">
            <Eye className="size-3.5" />
            预览
          </ToggleGroupItem>
        </ToggleGroup>

        <InputGroupText className="ml-auto text-sm text-muted-foreground">
          {value.length}/{maxLength}
        </InputGroupText>

        <Separator className="mx-1" orientation="vertical" />

        <Button
          aria-label={sending ? "停止生成" : "发送"}
          className="size-8 rounded-full p-0 shadow-none"
          onClick={() => {
            if (!sending && !value.trim() && attachments.length === 0) {
              return
            }
            if (sending) {
              onStop()
              return
            }
            onSend()
          }}
          size="icon"
          type="button"
        >
          {sending ? (
            <Square className="size-3 fill-current" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

function FloatingToolButton({
  accept,
  disabled = false,
  icon,
  label,
  multiple = false,
  onChange,
  tooltip,
}: {
  accept: string
  disabled?: boolean
  icon: React.ReactNode
  label: string
  multiple?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          className="h-7 shrink-0 gap-1.5 rounded-full border bg-muted/40 px-2.5 text-xs shadow-none hover:bg-muted"
          disabled={disabled}
          size="sm"
          type="button"
          variant="outline"
        >
          <label className={disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}>
            <input
              accept={accept}
              className="hidden"
              disabled={disabled}
              multiple={multiple}
              onChange={onChange}
              type="file"
            />
            {icon}
            <span>{label}</span>
          </label>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
