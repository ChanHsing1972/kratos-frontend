import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import {
  Activity,
  ArrowUp,
  BrainCircuit,
  ChartNoAxesColumn,
  Check,
  Eye,
  Heart,
  ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Plus,
  SearchIcon,
  Sparkles,
  Square,
  Utensils,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react"

import type {
  AgentToolConfig,
  ChatAttachment,
  Skill,
} from "@/entities/kratos/model/types"
import { MarkdownMessage } from "@/widgets/kratos/conversation/MarkdownMessage"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/shared/ui/input-group"
import { Separator } from "@/shared/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/tooltip"

export type AgentComposerMode = {
  id: string
  initialPrompt?: string
  label: string
  placeholder: string
  promptPrefix: string
}

export type ComposerUploadingAttachment = {
  content_type: string
  filename: string
  id: string
  size: number
}

type ComposerDataCategory = "body" | "health" | "diet"

type ConversationComposerProps = {
  activeMode: AgentComposerMode | null
  attachments: ChatAttachment[]
  uploadingAttachments: ComposerUploadingAttachment[]
  dietEstimating: boolean
  maxLength?: number
  onAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onChange: (value: string) => void
  onDietImage: (event: ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onModeChange: (mode: AgentComposerMode | null) => void
  onOpenAddData: (category: ComposerDataCategory) => void
  onOpenCapabilities: () => void
  onOpenTrainingPlanComposer: () => void
  onRemoveAttachment: (index: number) => void
  onSend: () => void
  onStop: () => void
  sending: boolean
  skills: Skill[]
  tools: AgentToolConfig[]
  value: string
}

type ComposerModeOption = AgentComposerMode & {
  description: string
  disabled?: boolean
  icon: LucideIcon
  status?: string
}

const attachmentAccept =
  "image/*,.csv,.doc,.docx,.json,.pdf,.txt,.xls,.xlsx"
const dietImageAccept = "image/jpeg,image/png,image/webp"

const coreModeOptions: ComposerModeOption[] = [
  {
    description: "生成长期周期计划",
    icon: Sparkles,
    id: "training-plan",
    initialPrompt:
      "请根据我的目标、身体数据、训练偏好和恢复情况，为我生成本周训练计划。",
    label: "生成训练计划",
    placeholder: "描述状态、周期、频率、器械、目标和限制…",
    promptPrefix:
      "你现在处于「生成训练计划」模式。请读取我的档案、近期训练、身体数据、恢复状态和可用工具，生成可保存的长期或周期训练计划，包含周期长度、每周安排、训练目标、恢复建议和营养建议。如果信息不足，先基于已知上下文给出保守方案并列出需要补充的问题。",
  },
  {
    description: "文字描述交给 Agent 估算；食物图片可直接识别",
    icon: Utensils,
    id: "diet-log",
    label: "记录饮食",
    placeholder: "上传食物图片或描述食物，我会估算热量…",
    promptPrefix:
      "你现在处于「记录饮食」模式。请根据我上传的食物图片或文字描述估算热量、蛋白质、脂肪和碳水，说明不确定性；如果是文字描述，也请直接进行估算并整理为可确认的饮食记录。",
  },
  {
    description: "记录体重、围度、体脂、睡眠和恢复感受",
    icon: ChartNoAxesColumn,
    id: "body-data",
    label: "更新身体数据",
    placeholder: "输入体重、体脂、围度、睡眠或恢复状态…",
    promptPrefix:
      "你现在处于「更新身体数据」模式。请从我的输入中提取身体指标、健康指标和恢复打卡信息，必要时提醒我确认后再保存。",
  },
  // {
  //   description: "判断今天是否适合上强度，给出降级建议",
  //   icon: ShieldCheck,
  //   id: "risk-assessment",
  //   label: "训练风险评估",
  //   placeholder: "告诉我疼痛、疲劳、睡眠、心率或压力情况…",
  //   promptPrefix:
  //     "你现在处于「训练风险评估」模式。请优先结合疼痛、安全分流、恢复状态、近期训练和可用工具，判断今天是否适合训练并给出替代方案。",
  // },
  {
    description: "根据刚完成的训练反馈调整后续安排",
    icon: Activity,
    id: "workout-review",
    label: "训练反馈调整",
    placeholder: "记录完成度、RPE、疼痛、心率或想调整的内容…",
    promptPrefix:
      "你现在处于「训练反馈调整」模式。请根据我的训练反馈、训练记录、当前计划和恢复状态，做复盘并建议是否调整后续训练。",
  },
]

const toolDisplayNames: Record<string, string> = {
  amap_bicycling_route: "骑行路线规划",
  amap_distance: "距离计算",
  amap_driving_route: "驾车路线规划",
  amap_geocode: "地址转坐标",
  amap_ip_location: "IP 定位",
  amap_place_search_around: "周边地点搜索",
  amap_transit_route: "公共交通路线",
  amap_walking_route: "步行路线规划",
  calculate_bmr: "基础代谢估算",
  calculate_calories_burned: "运动热量估算",
  calculate_workout_volume: "训练容量计算",
  diet_plan_generator: "饮食计划生成",
  estimate_1rm: "1RM 估算",
  heweather_geo_lookup: "城市天气定位",
  heweather_weather: "天气查询",
  musclewiki_api: "动作知识查询",
  pain_safety_gate: "训练安全分流",
  rapidapi_bodyparts: "可训练部位查询",
  running_route_advisor: "跑步路线推荐",
  spoonacular_recipe_search: "食谱搜索",
  tavily_search: "联网搜索",
  weather_fitness_advisor: "天气运动建议",
}

export function ConversationComposer({
  activeMode,
  attachments,
  uploadingAttachments,
  dietEstimating,
  maxLength = 1000,
  onAttachment,
  onChange,
  onDietImage,
  onKeyDown,
  onModeChange,
  onOpenAddData,
  onOpenCapabilities,
  onOpenTrainingPlanComposer,
  onRemoveAttachment,
  onSend,
  onStop,
  sending,
  skills,
  tools,
  value,
}: ConversationComposerProps) {
  const [viewMode, setViewMode] = useState<"write" | "preview">("write")
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const dietImageInputRef = useRef<HTMLInputElement | null>(null)
  const imageAttachmentInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const skillModeOptions = useMemo(
    () =>
      skills
        .filter((skill) => skill.enabled)
        .map<ComposerModeOption>((skill) => ({
          description:
            skill.description ??
            skill.applicable_scenarios ??
            "使用已启用的自定义或内置教练策略",
          icon: BrainCircuit,
          id: `skill:${skill.id}`,
          label: skill.name,
          placeholder: `${skill.name}：描述你的目标、限制或问题…`,
          promptPrefix: [
            `你现在处于「${skill.name}」Skill 模式。`,
            skill.prompt_snippet
              ? `请优先遵循这条策略：${skill.prompt_snippet}`
              : null,
            skill.output_format ? `期望输出格式：${skill.output_format}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        })),
    [skills]
  )
  const toolModeOptions = useMemo(
    () =>
      [...tools]
        .sort((a, b) =>
          `${a.category}:${a.name}`.localeCompare(`${b.category}:${b.name}`)
        )
        .map<ComposerModeOption>((tool) => {
          const selectable = isToolSelectable(tool)
          return {
            description: tool.description ?? "Agent 后端工具",
            disabled: !selectable,
            icon: iconForToolCategory(tool.category),
            id: `tool:${tool.name}`,
            label: toolDisplayNames[tool.name] ?? humanizeToolName(tool.name),
            placeholder: placeholderForTool(tool),
            promptPrefix:
              `你现在处于「${toolDisplayNames[tool.name] ?? humanizeToolName(tool.name)}」工具模式。` +
              `请优先判断是否需要调用 Agent 工具 ${tool.name}` +
              `${tool.description ? `（${tool.description}）` : ""}，并围绕该工具能力回答。`,
            status: toolStatusLabel(tool),
          }
        }),
    [tools]
  )
  const allModeOptions = useMemo(
    () => [...coreModeOptions, ...skillModeOptions, ...toolModeOptions],
    [skillModeOptions, toolModeOptions]
  )
  const activeModeOption = activeMode
    ? allModeOptions.find((option) => option.id === activeMode.id)
    : null
  const toolGroups = useMemo(
    () =>
      toolModeOptions.reduce<Record<string, ComposerModeOption[]>>(
        (result, option) => {
          const tool = tools.find((item) => `tool:${item.name}` === option.id)
          const category = tool?.category ?? "general"
          result[category] = [...(result[category] ?? []), option]
          return result
        },
        {}
      ),
    [toolModeOptions, tools]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value, viewMode])

  const selectMode = (option: ComposerModeOption) => {
    onModeChange(stripModeOption(option))
    if (option.initialPrompt && !value.trim()) {
      onChange(option.initialPrompt.slice(0, maxLength))
    }
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }
  const canSend = value.trim().length > 0 || attachments.length > 0
  const hasAttachmentBadges =
    uploadingAttachments.length > 0 || attachments.length > 0
  const placeholder = sending
    ? "Kratos 正在思考…"
    : activeMode?.placeholder ?? "今天我想完成什么…"

  return (
    <InputGroup className="max-h-[300px] rounded-[28px] bg-background p-1.5 shadow-[0_18px_58px_rgba(15,23,42,0.055),0_3px_14px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.035] transition-shadow focus-within:shadow-[0_22px_68px_rgba(15,23,42,0.075),0_5px_18px_rgba(15,23,42,0.045)] dark:shadow-[0_18px_58px_rgba(0,0,0,0.22),0_3px_14px_rgba(0,0,0,0.16)] dark:ring-white/[0.05] dark:focus-within:shadow-[0_22px_68px_rgba(0,0,0,0.28),0_5px_18px_rgba(0,0,0,0.18)]">
      <input
        accept={attachmentAccept}
        className="hidden"
        multiple
        onChange={onAttachment}
        ref={attachmentInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          if (!value.trim()) {
            onChange("请识别这张图片，并说明其中与训练、饮食或健康有关的信息。")
          }
          onAttachment(event)
        }}
        ref={imageAttachmentInputRef}
        type="file"
      />
      <input
        accept={dietImageAccept}
        className="hidden"
        onChange={onDietImage}
        ref={dietImageInputRef}
        type="file"
      />

      {hasAttachmentBadges ? (
        <InputGroupAddon align="block-start" className="flex-wrap justify-start">
          {uploadingAttachments.map((attachment) => (
            <UploadingAttachmentPill attachment={attachment} key={attachment.id} />
          ))}
          {attachments.map((attachment, index) => (
            <AttachmentPill
              attachment={attachment}
              index={index}
              key={`${attachment.url}-${index}`}
              onRemove={onRemoveAttachment}
            />
          ))}
        </InputGroupAddon>
      ) : null}

      {viewMode === "write" ? (
        <InputGroupTextarea
          className="min-h-20 resize-none px-3 text-base disabled:opacity-100 md:text-base"
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
          onCompositionEnd={(event) => {
            event.currentTarget.dataset.composing = "false"
          }}
          onCompositionStart={(event) => {
            event.currentTarget.dataset.composing = "true"
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          ref={textareaRef}
          rows={1}
          value={value}
        />
      ) : (
        <div
          className="min-h-20 w-full px-3 py-1.75"
          data-slot="input-group-control"
        >
          {value.trim() ? (
            <MarkdownMessage className="text-default leading-6 text-foreground">
              {value}
            </MarkdownMessage>
          ) : (
            <p className="text-default leading-6 text-muted-foreground">
              没有预览的内容
            </p>
          )}
        </div>
      )}

      <InputGroupAddon align="block-end" className="flex-wrap gap-2 pt-0">
        <CapabilityMenu
          activeModeId={activeMode?.id ?? null}
          coreModes={coreModeOptions}
          dietEstimating={dietEstimating}
          onAttachment={() => attachmentInputRef.current?.click()}
          onDietImage={() => dietImageInputRef.current?.click()}
          onImageAttachment={() => imageAttachmentInputRef.current?.click()}
          onOpenAddData={onOpenAddData}
          onOpenCapabilities={onOpenCapabilities}
          onOpenTrainingPlanComposer={onOpenTrainingPlanComposer}
          onSelectMode={selectMode}
          sending={sending}
          skillModes={skillModeOptions}
          toolGroups={toolGroups}
        />


        <ToggleGroup
          className="hidden sm:flex"
          onValueChange={(nextMode) => {
            if (nextMode === "write" || nextMode === "preview") {
              setViewMode(nextMode)
            }
          }}
          type="single"
          value={viewMode}
          variant="outline"
        >
          <ToggleGroupItem value="write">
            <PencilLine className="size-3.5" />
            编辑
          </ToggleGroupItem>
          <ToggleGroupItem value="preview">
            <Eye className="size-3.5" />
            预览
          </ToggleGroupItem>
        </ToggleGroup>


        {activeMode ? (
          <ActiveModeBadge
            icon={activeModeOption?.icon ?? Sparkles}
            mode={activeMode}
            onClear={() => onModeChange(null)}
          />
        ) : null}

        <InputGroupText className="ml-auto hidden text-sm text-muted-foreground sm:flex">
          {value.length}/{maxLength}
        </InputGroupText>

        <Separator className="mx-1 hidden h-8 sm:block" orientation="vertical" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={sending ? "终止 Agent" : "发送"}
              aria-disabled={!sending && !canSend}
              className={
                !canSend && !sending
                  ? "size-8 rounded-full p-0 opacity-45 shadow-none"
                  : "size-8 rounded-full p-0 shadow-none"
              }
              onClick={() => {
                if (sending) {
                  onStop()
                  return
                }
                if (!canSend) {
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
          </TooltipTrigger>
          <TooltipContent side="top">{sending ? "终止 Agent" : "发送"}</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

function CapabilityMenu({
  activeModeId,
  coreModes,
  onAttachment,
  onSelectMode,
  sending,
  skillModes,
  toolGroups,
}: {
  activeModeId: string | null
  coreModes: ComposerModeOption[]
  dietEstimating: boolean
  onAttachment: () => void
  onDietImage: () => void
  onImageAttachment: () => void
  onOpenAddData: (category: ComposerDataCategory) => void
  onOpenCapabilities: () => void
  onOpenTrainingPlanComposer: () => void
  onSelectMode: (mode: ComposerModeOption) => void
  sending: boolean
  skillModes: ComposerModeOption[]
  toolGroups: Record<string, ComposerModeOption[]>
}) {
  const toolGroupEntries = Object.entries(toolGroups)
  const hasMoreItems = skillModes.length > 0 || toolGroupEntries.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton
          aria-label="打开 Agent 能力菜单"
          className="size-8 rounded-full border p-0 shadow-none"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        avoidCollisions={true}
        className="max-h-[min(72vh,300px)] w-[min(88vw,240px)] rounded-2xl p-2"
        side="bottom"
        sideOffset={8}
      >
        <CapabilityMenuItem
          description="图片、文档、表格会作为本轮上下文发送给 Agent"
          disabled={sending}
          icon={Paperclip}
          label="上传文件"
          onSelect={onAttachment}
        />

        <DropdownMenuSeparator />
        {coreModes.map((mode) => (
          <CapabilityMenuItem
            checked={activeModeId === mode.id}
            description={mode.description}
            disabled={sending}
            icon={mode.icon}
            key={mode.id}
            label={mode.label}
            onSelect={() => onSelectMode(mode)}
          />
        ))}

        {hasMoreItems ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-auto gap-3 rounded-xl py-2">
                <MoreHorizontal className="size-4" />
                更多
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[min(72vh,420px)] w-[min(88vw,280px)] overflow-y-auto rounded-2xl p-2">
                {skillModes.length ? (
                  <>
                    <DropdownMenuLabel>已启用 Skills</DropdownMenuLabel>
                    {skillModes.map((mode) => (
                      <CapabilityMenuItem
                        checked={activeModeId === mode.id}
                        description={mode.description}
                        disabled={sending}
                        icon={mode.icon}
                        key={mode.id}
                        label={mode.label}
                        onSelect={() => onSelectMode(mode)}
                      />
                    ))}
                  </>
                ) : null}

                {toolGroupEntries.map(([category, modes], index) => (
                  <div key={category}>
                    {skillModes.length || index > 0 ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    <DropdownMenuLabel>{toolCategoryLabel(category)}</DropdownMenuLabel>
                    {modes.map((mode) => (
                      <CapabilityMenuItem
                        checked={activeModeId === mode.id}
                        description={mode.description}
                        disabled={sending || mode.disabled}
                        icon={mode.icon}
                        key={mode.id}
                        label={mode.label}
                        onSelect={() => onSelectMode(mode)}
                        status={mode.status}
                      />
                    ))}
                  </div>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CapabilityMenuItem({
  checked = false,
  disabled = false,
  icon: Icon,
  label,
  onSelect,
  status,
}: {
  checked?: boolean
  description: string
  disabled?: boolean
  icon: LucideIcon
  label: string
  onSelect: () => void
  status?: string
}) {
  return (
    <DropdownMenuItem
      className="h-auto gap-3 rounded-xl py-2"
      disabled={disabled}
      onSelect={onSelect}
    >
      <Icon className="size-4" />
      <span className="block truncate text-sm">{label}</span>
      {checked ? (
        <Check className="ml-auto size-4 text-primary" />
      ) : status ? (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{status}</span>
      ) : null}
    </DropdownMenuItem>
  )
}

function ActiveModeBadge({
  icon: Icon,
  mode,
  onClear,
}: {
  icon: LucideIcon
  mode: AgentComposerMode
  onClear: () => void
}) {
  return (
    <Badge
      className="h-8 rounded-full border-border bg-none text-muted-foreground"
      variant="outline"
    >
      <Icon className="size-3.5" />
      <span className="max-w-36 truncat text-sm">{mode.label}</span>
      <button
        aria-label={`取消${mode.label}模式`}
        className="grid size-4 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={onClear}
        type="button"
      >
        <X className="size-3.5" />
      </button>
    </Badge>
  )
}

function AttachmentPill({
  attachment,
  index,
  onRemove,
}: {
  attachment: ChatAttachment
  index: number
  onRemove: (index: number) => void
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-md border bg-muted px-2 py-1 text-xs text-foreground">
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
        onClick={() => onRemove(index)}
        type="button"
      >
        <X className="size-3.5" />
      </button>
    </span>
  )
}

function UploadingAttachmentPill({
  attachment,
}: {
  attachment: ComposerUploadingAttachment
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-border/80 bg-muted/70 px-2 py-1 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" />
      <span className="max-w-40 truncate">{attachment.filename}</span>
      <span className="shrink-0 text-[11px]">上传中</span>
    </span>
  )
}

function stripModeOption(option: ComposerModeOption): AgentComposerMode {
  return {
    id: option.id,
    initialPrompt: option.initialPrompt,
    label: option.label,
    placeholder: option.placeholder,
    promptPrefix: option.promptPrefix,
  }
}

function isToolSelectable(tool: AgentToolConfig) {
  return (
    tool.enabled &&
    !(tool.requires_api_key && !tool.api_key_configured) &&
    !["disabled", "unavailable"].includes(tool.health_status)
  )
}

function toolStatusLabel(tool: AgentToolConfig) {
  if (tool.requires_api_key && !tool.api_key_configured) return "需配置"
  if (!tool.enabled || tool.health_status === "disabled") return "未启用"
  if (tool.health_status === "unavailable") return "不可用"
  if (tool.health_status === "degraded") return "不稳定"
  return undefined
}

function iconForToolCategory(category: string): LucideIcon {
  if (category === "search") return SearchIcon
  if (category === "diet") return Utensils
  if (category === "weather") return Activity
  if (category === "fitness") return Heart
  if (category === "fitness_knowledge") return Wrench
  return Wrench
}

function placeholderForTool(tool: AgentToolConfig) {
  if (tool.category === "search") return "输入要查询的主题、赛事、论文或最新信息…"
  if (tool.category === "location") return "告诉我地点、距离、路线或附近设施需求…"
  if (tool.category === "diet") return "输入食材、饮食限制、热量目标或菜谱需求…"
  if (tool.category === "weather") return "输入城市、训练时间和户外运动偏好…"
  if (tool.category === "fitness_knowledge") return "输入动作、肌群、器械或训练知识问题…"
  if (tool.category === "fitness") return "输入训练重量、次数、疼痛、消耗或容量需求…"
  return "描述你想让这个工具协助完成的任务…"
}

function toolCategoryLabel(category: string) {
  return (
    {
      diet: "营养与饮食工具",
      fitness: "训练计算与安全工具",
      fitness_knowledge: "动作知识工具",
      location: "路线与位置工具",
      search: "联网查询工具",
      weather: "环境与天气工具",
    }[category] ?? "其他工具"
  )
}

function humanizeToolName(name: string) {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
