import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BadgeCheck,
  BookOpenText,
  Check,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCcw,
  SearchIcon,
  ShieldCheck,
  SlidersHorizontal,
  ToolCase,
  Trash2,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react"

import type { AgentToolConfig, Skill, SkillPayload, UserProfile } from "@/entities/kratos/model/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/shared/ui/input-group"
import { Spinner } from "@/shared/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

type SkillPanelPageProps = {
  currentUser: UserProfile | null
  error: string | null
  loading: boolean
  onCreateSkill: (payload: SkillPayload) => Promise<void> | void
  onDeleteSkill: (skill: Skill) => Promise<void> | void
  onLogin: () => void
  onRefresh: () => Promise<void> | void
  onToggleSkill: (skill: Skill, enabled: boolean) => Promise<void> | void
  onToggleTool: (tool: AgentToolConfig, enabled: boolean) => Promise<void> | void
  skills: Skill[]
  tools: AgentToolConfig[]
  submitting: boolean
}

type SkillForm = {
  name: string
  description: string
  applicableScenarios: string
  promptSnippet: string
  availableTools: string
  outputFormat: string
  forbiddenRules: string
}

const defaultForm: SkillForm = {
  name: "宿舍无器械训练教练",
  description: "适合宿舍、无器械、小空间训练的轻量策略。",
  applicableScenarios: "用户只有宿舍空间、没有器械、希望安排徒手训练。",
  promptSnippet: "优先选择安静、低冲击、无需器械的动作，并给出邻里友好版本。",
  availableTools: "calculate_workout_volume, pain_safety_gate",
  outputFormat: "按热身、主训练、拉伸、注意事项输出。",
  forbiddenRules: "不要安排跳跃噪音过大的动作；不要建议危险借力动作。",
}

export function SkillPanelPage({
  currentUser,
  error,
  loading,
  onCreateSkill,
  onDeleteSkill,
  onLogin,
  onRefresh,
  onToggleSkill,
  onToggleTool,
  skills,
  tools,
  submitting,
}: SkillPanelPageProps) {
  const [skillFilter, setSkillFilter] = useState<"all" | "active" | "custom">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [tabValue, setTabValue] = useState<"skills" | "tools">("skills")
  const [form, setForm] = useState<SkillForm>(defaultForm)
  const [formError, setFormError] = useState<string | null>(null)
  const enabledSkills = skills.filter((skill) => skill.enabled)
  const unresolvedTools = useMemo(() => getUnresolvedToolDependencies(enabledSkills, tools), [enabledSkills, tools])
  const normalizedQuery = normalizeQuery(searchQuery)
  // const skillFilterLabel = getSkillFilterLabel(skillFilter)
  const visibleSkills = skills.filter((skill) => {
    if (skillFilter === "active") return skill.enabled
    if (skillFilter === "custom") return !skill.is_builtin
    return true
  }).filter((skill) =>
    matchesQuery(
      normalizedQuery,
      skill.name,
      skill.description,
      skill.applicable_scenarios,
      skill.prompt_snippet,
      skill.available_tools.join(" ")
    )
  )
  const visibleTools = tools.filter((tool) =>
    matchesQuery(
      normalizedQuery,
      tool.name,
      tool.description,
      tool.category,
      toolCategoryLabel(tool.category)
    )
  )

  const updateForm = (field: keyof SkillForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError(null)
  }

  const submitSkill = async (event: FormEvent) => {
    event.preventDefault()
    if (!currentUser) {
      onLogin()
      return
    }
    if (!form.name.trim() || !form.promptSnippet.trim()) {
      setFormError("请填写名称和核心策略")
      return
    }
    try {
      await onCreateSkill({
        name: form.name.trim(),
        description: compactOptional(form.description),
        applicable_scenarios: compactOptional(form.applicableScenarios),
        prompt_snippet: compactOptional(form.promptSnippet),
        available_tools: parseTools(form.availableTools),
        output_format: compactOptional(form.outputFormat),
        forbidden_rules: compactOptional(form.forbiddenRules),
      })
      setCreateOpen(false)
      setSkillFilter("all")
    } catch {
      // App owns API error feedback.
    }
  }

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-20 flex min-h-full w-full max-w-[900px] flex-col sm:p-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-medium tracking-[-0.05em]">能力中心</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              选择教练策略，并管理这些策略实际可以调用的工具。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button disabled={loading} onClick={onRefresh} size="icon" type="button" variant="ghost">
              {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCcw />}
              <span className="sr-only">刷新能力列表</span>
            </Button>
            <InputGroup className="w-full sm:w-64">
              <InputGroupInput
                aria-label="搜索 Skills 或 Tools"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索 Skills / Tools"
                value={searchQuery}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </header>

        {error ? <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

        <Tabs className="mt-8" value={tabValue} onValueChange={(value) => setTabValue(value as "skills" | "tools")}>
          <div className="flex items-center justify-between">
            <TabsList aria-label="能力中心分类" variant="line">
              <TabsTrigger value="skills">
                <WandSparkles />
                Skills
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Wrench />
                Tools
              </TabsTrigger>

            </TabsList>
            {tabValue === "skills" && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="default" type="button" variant="outline">
                      <Filter className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {[
                      ["all", "全部"],
                      ["active", "已启用"],
                      ["custom", "自建"],
                    ].map(([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => setSkillFilter(value as "all" | "active" | "custom")}
                      >
                        <Check className={skillFilter === value ? "opacity-100" : "opacity-0"} />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setCreateOpen(true)} size="default" variant="outline">
                  <Plus className="size-3.5" />
                  创建策略
                </Button>
              </div>
            )}
          </div>


          <TabsContent className="mt-3" value="skills">
            <SkillsPanel
              currentUser={currentUser}
              filter={skillFilter}
              loading={loading}
              onLogin={onLogin}
              onSetFilter={setSkillFilter}
              onDeleteSkill={onDeleteSkill}
              onToggleSkill={onToggleSkill}
              onCreateOpen={() => setCreateOpen(true)}
              searchQuery={searchQuery}
              skills={visibleSkills}
              submitting={submitting}
            />
          </TabsContent>
          <TabsContent className="mt-3" value="tools">
            <ToolsPanel
              loading={loading}
              onLogin={onLogin}
              onToggleTool={onToggleTool}
              submitting={submitting}
              searchQuery={searchQuery}
              tools={visibleTools}
              unresolvedTools={unresolvedTools}
              user={currentUser}
            />
          </TabsContent>

        </Tabs>

      </section>

      <CreateSkillSheet
        currentUser={currentUser}
        form={form}
        formError={formError}
        onLogin={onLogin}
        onOpenChange={setCreateOpen}
        onSubmit={submitSkill}
        onUpdateForm={updateForm}
        open={createOpen}
        submitting={submitting}
      />
    </main>
  )
}

function SkillsPanel({
  currentUser,
  loading,
  onDeleteSkill,
  onLogin,
  onToggleSkill,
  searchQuery,
  skills,
  submitting,
}: {
  currentUser: UserProfile | null
  filter: "all" | "active" | "custom"
  loading: boolean
  onDeleteSkill: (skill: Skill) => Promise<void> | void
  onLogin: () => void
  onSetFilter: (filter: "all" | "active" | "custom") => void
  onToggleSkill: (skill: Skill, enabled: boolean) => Promise<void> | void
  onCreateOpen: () => void
  searchQuery: string
  skills: Skill[]
  submitting: boolean
}) {
  if (!currentUser) {
    return <LoginEmpty description="登录后选择教练策略，并保存您的启用配置。" onLogin={onLogin} />
  }
  if (loading && !skills.length) {
    return <LoadingEmpty label="正在读取策略" />
  }

  return (
    <div>
      {skills.length ? (
        <Accordion className="divide-y" collapsible type="single">
          {skills.map((skill) => (
            <SkillAccordionItem
              key={skill.id}
              onDelete={() => onDeleteSkill(skill)}
              onToggle={(enabled) => onToggleSkill(skill, enabled)}
              skill={skill}
              submitting={submitting}
            />
          ))}
        </Accordion>
      ) : (
        <Empty className="min-h-52 border">
          <EmptyHeader>
            <EmptyTitle>{searchQuery.trim() ? "没有匹配的 Skill" : "这个筛选下没有策略"}</EmptyTitle>
            <EmptyDescription>
              {searchQuery.trim() ? "尝试更换关键词，或清空搜索后查看全部策略。" : "切换到全部策略，或创建一个适合自己的教练策略。"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function SkillAccordionItem({
  onDelete,
  onToggle,
  skill,
  submitting,
}: {
  onDelete: () => Promise<void> | void
  onToggle: (enabled: boolean) => Promise<void> | void
  skill: Skill
  submitting: boolean
}) {
  return (
    <AccordionItem value={`skill-${skill.id}`}>
      <AccordionTrigger className="no-underline hover:no-underline">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-base">{skill.name}</span>
            <Badge variant="outline">
              {skill.is_builtin ? "内置" : "自建"}
            </Badge>
            {skill.enabled ? <Badge variant="secondary">启用中</Badge> : null}
          </span>
          <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
            {skill.description ?? skill.applicable_scenarios ?? "暂无适用场景说明"}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 overflow-hidden pb-6">
        <div className="mt-3 grid gap-10 sm:grid-cols-2">
          <DetailBlock icon={SlidersHorizontal} label="核心策略" value={skill.prompt_snippet} />
          <DetailBlock icon={ShieldCheck} label="安全边界" value={skill.forbidden_rules} />
        </div>
        <div>
          {/* <p className="text-sm font-medium text-muted-foreground">依赖工具</p> */}
          <div className="flex flex-wrap gap-2">
            {skill.available_tools.length ? (
              skill.available_tools.map((tool) => <Badge key={tool} variant="outline">{tool}</Badge>)
            ) : (
              <Badge variant="outline">不限制工具范围</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={submitting}
            onClick={() => onToggle(!skill.enabled)}
            type="button"
            variant={skill.enabled ? "outline" : "default"}
          >
            {skill.enabled ? <X /> : <Check />}
            {skill.enabled ? "停用策略" : "启用策略"}
          </Button>
          {!skill.is_builtin ? (
            <Button disabled={submitting} onClick={onDelete} type="button" variant="ghost">
              <Trash2 />
              删除
            </Button>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function ToolsPanel({
  loading,
  onLogin,
  onToggleTool,
  submitting,
  tools,
  searchQuery,
  user,
}: {
  loading: boolean
  onLogin: () => void
  onToggleTool: (tool: AgentToolConfig, enabled: boolean) => Promise<void> | void
  submitting: boolean
  tools: AgentToolConfig[]
  searchQuery: string
  unresolvedTools: string[]
  user: UserProfile | null
}) {
  if (!user) {
    return <LoginEmpty description="登录后管理 Agent 是否可以调用计算、知识与安全工具。" onLogin={onLogin} />
  }
  if (loading && !tools.length) {
    return <LoadingEmpty label="正在读取工具" />
  }

  const [pendingToolName, setPendingToolName] = useState<string | null>(null)

  const groups = Object.entries(
    tools.reduce<Record<string, AgentToolConfig[]>>((result, tool) => {
      result[tool.category] = [...(result[tool.category] ?? []), tool]
      return result
    }, {})
  )

  return (
    <div className="space-y-4">
      {/* {unresolvedTools.length ? (
        <div className="rounded-xl bg-destructive/8 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">有 Skill 正在等待工具修复</p>
          <p className="mt-1 text-muted-foreground">{unresolvedTools.join("、")} 尚未启用或缺少配置。</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          工具只在已启用且符合 Skill 范围时被调用。缺少密钥的工具无法误启用。
        </p>
      )} */}
      {groups.length ? (
        <Accordion collapsible type="single">
          {groups.map(([category, categoryTools]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="no-underline hover:no-underline">
                <span className="flex flex-1 items-center justify-between pr-3">
                  <span className="text-base">{toolCategoryLabel(category)}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {categoryTools.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="divide-y px-6">
                  {categoryTools.map((tool) => (
                    <ToolRow
                      key={tool.name}
                      onToggle={async () => {
                        setPendingToolName(tool.name)
                        try {
                          await onToggleTool(tool, !tool.enabled)
                        } finally {
                          setPendingToolName(null)
                        }
                      }}
                      pending={pendingToolName === tool.name}
                      submitting={submitting}
                      tool={tool}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Empty className="min-h-52 border">
          <EmptyHeader>
            <EmptyTitle>{searchQuery.trim() ? "没有匹配的 Tool" : "暂未加载任何工具"}</EmptyTitle>
            <EmptyDescription>
              {searchQuery.trim() ? "尝试使用工具名称、说明或分类进行搜索。" : "刷新后仍为空时，请检查后端工具配置。"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function ToolRow({
  onToggle,
  pending,
  tool,
}: {
  onToggle: () => Promise<void> | void
  pending: boolean
  submitting: boolean
  tool: AgentToolConfig
}) {
  const unavailable = !isAvailable(tool)
  return (
    <div className="flex flex-col py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <p className="font-medium">{tool.name}</p>
          <Badge
            variant={unavailable ? "destructive" : tool.enabled ? "outline" : "default"}
          >
            {tool.enabled ? <Check data-icon="inline-start" /> : <X data-icon="inline-start" />}
            {unavailable ? "需配置" : tool.enabled ? "已启用" : "未启用"}
          </Badge>
        </div>
        <p className="-mt-3 text-sm leading-5 text-muted-foreground">{tool.description ?? "未提供工具说明"}</p>
        {tool.failure_count > 0 ? (
          <p className="mt-1 text-xs text-destructive">最近调用失败 {tool.failure_count} 次</p>
        ) : null}
      </div>
      <Button
        disabled={pending || unavailable}
        onClick={onToggle}
        size="sm"
        type="button"
        variant={tool.enabled ? " ghost" : "default"}
      >
        {pending && <Spinner />}
        {tool.enabled ? "禁用" : "启用"}
      </Button>
    </div>
  )
}

function CreateSkillSheet({
  currentUser,
  form,
  formError,
  onLogin,
  onOpenChange,
  onSubmit,
  onUpdateForm,
  open,
  submitting,
}: {
  currentUser: UserProfile | null
  form: SkillForm
  formError: string | null
  onLogin: () => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent) => void
  onUpdateForm: (field: keyof SkillForm, value: string) => void
  open: boolean
  submitting: boolean
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>创建教练策略</SheetTitle>
          <SheetDescription>
            定义 Agent 应遵循的建议风格、安全边界和可用工具。保存后可随时停用。
          </SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-6">
              <FormField label="策略名称">
                <Input onChange={(event) => onUpdateForm("name", event.target.value)} value={form.name} />
              </FormField>
              <FormField label="用途说明">
                <Textarea className="min-h-18" onChange={(event) => onUpdateForm("description", event.target.value)} value={form.description} />
              </FormField>
              <FormField label="核心策略">
                <Textarea className="min-h-28" onChange={(event) => onUpdateForm("promptSnippet", event.target.value)} value={form.promptSnippet} />
              </FormField>
              <Accordion collapsible type="single">
                <AccordionItem value="advanced">
                  <AccordionTrigger>更多边界设置</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField label="适用场景">
                      <Textarea onChange={(event) => onUpdateForm("applicableScenarios", event.target.value)} value={form.applicableScenarios} />
                    </FormField>
                    <FormField label="可用工具名称">
                      <Input onChange={(event) => onUpdateForm("availableTools", event.target.value)} value={form.availableTools} />
                    </FormField>
                    <FormField label="输出格式">
                      <Textarea onChange={(event) => onUpdateForm("outputFormat", event.target.value)} value={form.outputFormat} />
                    </FormField>
                    <FormField label="禁止行为">
                      <Textarea onChange={(event) => onUpdateForm("forbiddenRules", event.target.value)} value={form.forbiddenRules} />
                    </FormField>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {formError ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</p> : null}
            </div>
          </ScrollArea>
          <SheetFooter>
            {currentUser ? (
              <Button disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Plus />}
                保存并启用策略
              </Button>
            ) : (
              <Button onClick={onLogin} type="button">登录后创建</Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function LoginEmpty({ description, onLogin }: { description: string; onLogin: () => void }) {
  return (
    <Empty className="min-h-56 border">
      <EmptyHeader>
        <EmptyMedia variant="icon"><BookOpenText /></EmptyMedia>
        <EmptyTitle>登录后管理能力</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button onClick={onLogin} type="button">登录</Button>
    </Empty>
  )
}

function LoadingEmpty({ label }: { label: string }) {
  return (
    <Empty className="min-h-56 border">
      <LoaderCircle className="animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </Empty>
  )
}

function DetailBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string | null
}) {
  return (
    <div className="">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="-mt-2 text-sm leading-6">{value || "未设置"}</p>
    </div>
  )
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

function getUnresolvedToolDependencies(enabledSkills: Skill[], tools: AgentToolConfig[]) {
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]))
  return Array.from(
    new Set(
      enabledSkills
        .flatMap((skill) => skill.available_tools)
        .filter((name) => {
          const tool = toolMap.get(name)
          return !tool || !tool.enabled || !isAvailable(tool)
        })
    )
  )
}

function isAvailable(tool: AgentToolConfig) {
  return !(tool.requires_api_key && !tool.api_key_configured) && tool.health_status !== "unavailable"
}

function toolCategoryLabel(category: string) {
  return {
    diet: "营养与饮食",
    fitness: "训练计算与安全",
    fitness_knowledge: "动作知识",
    location: "路线与位置",
    search: "联网查询",
    weather: "环境与天气",
  }[category] ?? category
}

function getSkillFilterLabel(filter: "all" | "active" | "custom") {
  return {
    all: "全部策略",
    active: "已启用",
    custom: "自建策略",
  }[filter]
}

function compactOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase()
}

function matchesQuery(query: string, ...fields: Array<string | null | undefined>) {
  if (!query) return true
  return fields.some((field) => field?.toLocaleLowerCase().includes(query))
}

function parseTools(value: string) {
  return value.split(/[\n,，]+/).map((item) => item.trim()).filter(Boolean)
}
