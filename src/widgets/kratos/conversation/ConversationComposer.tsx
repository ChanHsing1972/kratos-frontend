import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { ArrowUp, Eye, PencilLine, Plus, Square } from "lucide-react"

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
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"

type ConversationComposerProps = {
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onStop: () => void
  sending: boolean
  value: string
}

export function ConversationComposer({
  onAttachment,
  onChange,
  onKeyDown,
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
    <InputGroup className="max-h-60 bg-background p-1">
      {mode === "write" ? (
        <InputGroupTextarea
          className="min-h-16 resize-none text-base disabled:opacity-100 md:text-sm"
          onChange={(event) => onChange(event.target.value)}
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
          {value.length}/1000
        </InputGroupText>

        <Separator className="mx-1" orientation="vertical" />

        <Button
          aria-label={sending ? "停止生成" : "发送"}
          className="size-8 rounded-full p-0 shadow-none"
          onClick={() => {
            if (!sending && !value.trim()) {
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
