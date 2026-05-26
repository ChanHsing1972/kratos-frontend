import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  AlertCircle,
  BookOpenText,
  Check,
  LoaderCircle,
  Plus,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  Wrench,
  X,
} from "lucide-react"

import type { AgentToolConfig, Skill, SkillPayload, UserProfile } from "@/entities/kratos/model/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Textarea } from "@/shared/ui/textarea"

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
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<SkillForm>(defaultForm)
  const [formError, setFormError] = useState<string | null>(null)
  const enabledSkills = skills.filter((skill) => skill.enabled)
  const enabledTools = tools.filter((tool) => tool.enabled && isAvailable(tool))
  const unresolvedTools = useMemo(() => getUnresolvedToolDependencies(enabledSkills, tools), [enabledSkills, tools])
  const visibleSkills = skills.filter((skill) => {
    if (skillFilter === "active") return skill.enabled
    if (skillFilter === "custom") return !skill.is_builtin
    return true
  })

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
      setSkillFilter("active")
    } catch {
      // App owns API error feedback.
    }
  }

  return (
    <main className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-muted/40">
      <section className="mx-auto mt-16 flex min-h-full w-full max-w-[900px] flex-col px-6 pb-12 sm:px-8">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm text-muted-foreground">Agent 配置</p>
            <h1 className="mt-1 text-3xl font-medium tracking-[-0.05em]">能力中心</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Skill 决定教练的策略边界，Tool 提供计算或查询能力。只启用您真正希望 Agent 使用的能力。
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button disabled={loading} onClick={onRefresh} type="button" variant="ghost">
              {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCcw />}
              刷新
            </Button>
            <Button onClick={() => setCreateOpen(true)} type="button">
              <Plus />
              创建策略
            </Button>
          </div>
        </header>

        <ConfigurationHero
          enabledSkills={enabledSkills}
          enabledTools={enabledTools}
          unresolvedTools={unresolvedTools}
        />

        {error ? <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

        <Tabs className="mt-10" defaultValue="skills">
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

          <TabsContent className="mt-5" value="skills">
            <SkillsPanel
              currentUser={currentUser}
              filter={skillFilter}
              loading={loading}
              onLogin={onLogin}
              onSetFilter={setSkillFilter}
              onDeleteSkill={onDeleteSkill}
              onToggleSkill={onToggleSkill}
              skills={visibleSkills}
              submitting={submitting}
            />
          </TabsContent>
          <TabsContent className="mt-5" value="tools">
            <ToolsPanel
              loading={loading}
              onLogin={onLogin}
              onToggleTool={onToggleTool}
              submitting={submitting}
              tools={tools}
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

function ConfigurationHero({
  enabledSkills,
  enabledTools,
  unresolvedTools,
}: {
  enabledSkills: Skill[]
  enabledTools: AgentToolConfig[]
  unresolvedTools: string[]
}) {
  const status = unresolvedTools.length
    ? "有策略缺少可用工具"
    : enabledSkills.length
      ? "教练策略已就绪"
      : "尚未选择教练策略"
  const description = unresolvedTools.length
    ? `启用的策略需要 ${unresolvedTools.join("、")}，但工具尚未启用或未完成配置。`
    : enabledSkills.length
      ? "对话生成建议时，将只在这些策略允许的工具范围内工作。"
      : "选择一个内置策略后，Agent 才能稳定地遵守您的训练偏好与安全边界。"

  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {unresolvedTools.length ? <AlertCircle className="size-5 text-destructive" /> : <ShieldCheck className="size-5" />}
          {status}
        </CardTitle>
        <CardDescription className="max-w-xl leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 rounded-xl bg-muted/45 p-5 sm:grid-cols-3">
          <SummaryValue label="启用策略" value={`${enabledSkills.length} 个`} />
          <SummaryValue label="可调用工具" value={`${enabledTools.length} 个`} />
          <SummaryValue
            label="待处理依赖"
            value={unresolvedTools.length ? `${unresolvedTools.length} 项` : "无"}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SkillsPanel({
  currentUser,
  filter,
  loading,
  onDeleteSkill,
  onLogin,
  onSetFilter,
  onToggleSkill,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {[
            ["all", "全部"],
            ["active", "已启用"],
            ["custom", "自建"],
          ].map(([value, label]) => (
            <Button
              className="h-8"
              key={value}
              onClick={() => onSetFilter(value as "all" | "active" | "custom")}
              size="sm"
              type="button"
              variant={filter === value ? "secondary" : "ghost"}
            >
              {label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">展开策略查看行为边界与依赖工具</p>
      </div>
      {skills.length ? (
        <Card className="gap-0 py-0">
          <Accordion collapsible type="single">
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
        </Card>
      ) : (
        <Empty className="min-h-52 border">
          <EmptyHeader>
            <EmptyTitle>这个筛选下没有策略</EmptyTitle>
            <EmptyDescription>切换到全部策略，或创建一个适合自己的教练策略。</EmptyDescription>
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
    <AccordionItem className="px-5" value={`skill-${skill.id}`}>
      <AccordionTrigger className="no-underline hover:no-underline">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-base">{skill.name}</span>
            <Badge variant={skill.is_builtin ? "outline" : "secondary"}>
              {skill.is_builtin ? "内置" : "自建"}
            </Badge>
            {skill.enabled ? <Badge variant="secondary">启用中</Badge> : null}
          </span>
          <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
            {skill.description ?? skill.applicable_scenarios ?? "暂无适用场景说明"}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailBlock icon={SlidersHorizontal} label="教练会怎样建议" value={skill.prompt_snippet} />
          <DetailBlock icon={ShieldCheck} label="安全边界" value={skill.forbidden_rules} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">依赖工具</p>
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
  unresolvedTools,
  user,
}: {
  loading: boolean
  onLogin: () => void
  onToggleTool: (tool: AgentToolConfig, enabled: boolean) => Promise<void> | void
  submitting: boolean
  tools: AgentToolConfig[]
  unresolvedTools: string[]
  user: UserProfile | null
}) {
  if (!user) {
    return <LoginEmpty description="登录后管理 Agent 是否可以调用计算、知识与安全工具。" onLogin={onLogin} />
  }
  if (loading && !tools.length) {
    return <LoadingEmpty label="正在读取工具" />
  }

  const groups = Object.entries(
    tools.reduce<Record<string, AgentToolConfig[]>>((result, tool) => {
      result[tool.category] = [...(result[tool.category] ?? []), tool]
      return result
    }, {})
  )

  return (
    <div className="space-y-4">
      {unresolvedTools.length ? (
        <div className="rounded-xl bg-destructive/8 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">有 Skill 正在等待工具修复</p>
          <p className="mt-1 text-muted-foreground">{unresolvedTools.join("、")} 尚未启用或缺少配置。</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          工具只在已启用且符合 Skill 范围时被调用。缺少密钥的工具无法误启用。
        </p>
      )}
      {groups.length ? (
        <Card className="gap-0 py-0">
          <Accordion collapsible defaultValue={groups[0]?.[0]} type="single">
            {groups.map(([category, categoryTools]) => (
              <AccordionItem className="px-5" key={category} value={category}>
                <AccordionTrigger className="no-underline hover:no-underline">
                  <span className="flex flex-1 items-center justify-between pr-3">
                    <span className="text-base">{toolCategoryLabel(category)}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {categoryTools.filter((tool) => tool.enabled && isAvailable(tool)).length} / {categoryTools.length} 可调用
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="divide-y">
                    {categoryTools.map((tool) => (
                      <ToolRow
                        key={tool.name}
                        onToggle={() => onToggleTool(tool, !tool.enabled)}
                        submitting={submitting}
                        tool={tool}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      ) : (
        <Empty className="min-h-52 border">
          <EmptyHeader>
            <EmptyTitle>暂未加载任何工具</EmptyTitle>
            <EmptyDescription>刷新后仍为空时，请检查后端工具配置。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function ToolRow({
  onToggle,
  submitting,
  tool,
}: {
  onToggle: () => Promise<void> | void
  submitting: boolean
  tool: AgentToolConfig
}) {
  const unavailable = !isAvailable(tool)
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{tool.name}</p>
          <Badge variant={unavailable ? "outline" : tool.enabled ? "secondary" : "outline"}>
            {unavailable ? "需配置" : tool.enabled ? "可调用" : "未启用"}
          </Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{tool.description ?? "未提供工具说明"}</p>
        {tool.failure_count > 0 ? (
          <p className="mt-1 text-xs text-destructive">最近调用失败 {tool.failure_count} 次</p>
        ) : null}
      </div>
      <Button
        className="shrink-0"
        disabled={submitting || unavailable}
        onClick={onToggle}
        size="sm"
        type="button"
        variant={tool.enabled ? "outline" : "default"}
      >
        {tool.enabled ? "关闭" : "启用"}
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
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-lg">创建教练策略</SheetTitle>
          <SheetDescription>
            定义 Agent 应遵循的建议风格、安全边界和可用工具。保存后可随时停用。
          </SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-6 py-5">
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
          <SheetFooter className="border-t px-6 py-4">
            {currentUser ? (
              <Button disabled={submitting} type="submit">
                {submitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
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
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm leading-6">{value || "未设置"}</p>
    </div>
  )
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-medium">{value}</p>
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

function compactOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseTools(value: string) {
  return value.split(/[\n,，]+/).map((item) => item.trim()).filter(Boolean)
}
