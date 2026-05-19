import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BookOpenText,
  Check,
  LoaderCircle,
  Plus,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Skill, SkillPayload, UserProfile } from "@/types/kratos"

type SkillPageProps = {
  currentUser: UserProfile | null
  error: string | null
  loading: boolean
  onCreateSkill: (payload: SkillPayload) => Promise<void> | void
  onDeleteSkill: (skill: Skill) => Promise<void> | void
  onLogin: () => void
  onRefresh: () => Promise<void> | void
  onToggleSkill: (skill: Skill, enabled: boolean) => Promise<void> | void
  skills: Skill[]
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

export function SkillPage({
  currentUser,
  error,
  loading,
  onCreateSkill,
  onDeleteSkill,
  onLogin,
  onRefresh,
  onToggleSkill,
  skills,
  submitting,
}: SkillPageProps) {
  const [activeTab, setActiveTab] = useState<"market" | "mine">("market")
  const [form, setForm] = useState<SkillForm>(defaultForm)
  const [formError, setFormError] = useState<string | null>(null)

  const enabledCount = skills.filter((skill) => skill.enabled).length
  const customCount = skills.filter((skill) => skill.source === "custom").length
  const visibleSkills = useMemo(() => {
    if (activeTab === "market") {
      return skills
    }
    return skills.filter((skill) => skill.enabled || skill.source === "custom")
  }, [activeTab, skills])

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
    if (!form.name.trim()) {
      setFormError("请填写 Skill 名称")
      return
    }
    if (!form.promptSnippet.trim()) {
      setFormError("请填写系统提示片段")
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
      setActiveTab("mine")
    } catch {
      // App owns toast and API error display.
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-background">
      <section className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col px-6 py-7 sm:px-8 xl:px-12">
        <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[28px] leading-tight font-black">Skill</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              用领域能力包调整 Kratos Agent 的策略、输出格式和工具范围。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatPill icon={WandSparkles} label="已启用" value={enabledCount} />
            <StatPill icon={BookOpenText} label="自建" value={customCount} />
            <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCcw />}
              刷新
            </Button>
          </div>
        </header>

        {!currentUser ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>登录后管理 Skill</CardTitle>
              <CardDescription>
                Skill 绑定到用户账号，登录后才能启用内置能力或创建自己的训练教练。
              </CardDescription>
              <CardAction>
                <Button onClick={onLogin} type="button">登录</Button>
              </CardAction>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-6 pt-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border bg-muted p-1">
                <TabButton
                  active={activeTab === "market"}
                  label="Skill 市场"
                  onClick={() => setActiveTab("market")}
                />
                <TabButton
                  active={activeTab === "mine"}
                  label="我的 Skill"
                  onClick={() => setActiveTab("mine")}
                />
              </div>
              {error ? (
                <Badge variant="destructive">{error}</Badge>
              ) : null}
            </div>

            {loading && !skills.length ? (
              <Card className="grid min-h-[360px] place-items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  正在读取 Skill
                </div>
              </Card>
            ) : visibleSkills.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    onDelete={() => onDeleteSkill(skill)}
                    onToggle={(enabled) => onToggleSkill(skill, enabled)}
                    skill={skill}
                    submitting={submitting}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-sm text-muted-foreground">
                  当前没有可展示的 Skill。
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="min-w-0">
            <Card className="sticky top-0">
              <form onSubmit={submitSkill}>
                <CardHeader>
                  <CardTitle>新建 Skill</CardTitle>
                  <CardDescription>
                    字段会保存为 Markdown/YAML 描述，并在对话时注入 Agent prompt。
                  </CardDescription>
                  <CardAction>
                    <Badge>YAML</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Field label="名称">
                    <Input
                      onChange={(event) => updateForm("name", event.target.value)}
                      value={form.name}
                    />
                  </Field>
                  <Field label="描述">
                    <Textarea
                      className="min-h-16"
                      onChange={(event) => updateForm("description", event.target.value)}
                      value={form.description}
                    />
                  </Field>
                  <Field label="适用场景">
                    <Textarea
                      className="min-h-20"
                      onChange={(event) => updateForm("applicableScenarios", event.target.value)}
                      value={form.applicableScenarios}
                    />
                  </Field>
                  <Field label="系统提示片段">
                    <Textarea
                      className="min-h-24"
                      onChange={(event) => updateForm("promptSnippet", event.target.value)}
                      value={form.promptSnippet}
                    />
                  </Field>
                  <Field label="可用工具">
                    <Input
                      onChange={(event) => updateForm("availableTools", event.target.value)}
                      value={form.availableTools}
                    />
                  </Field>
                  <Field label="输出格式">
                    <Textarea
                      className="min-h-16"
                      onChange={(event) => updateForm("outputFormat", event.target.value)}
                      value={form.outputFormat}
                    />
                  </Field>
                  <Field label="禁忌规则">
                    <Textarea
                      className="min-h-16"
                      onChange={(event) => updateForm("forbiddenRules", event.target.value)}
                      value={form.forbiddenRules}
                    />
                  </Field>
                  {formError ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {formError}
                    </p>
                  ) : null}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={submitting || !currentUser} type="submit">
                    {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Plus />}
                    创建并启用
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  )
}

function SkillCard({
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
    <Card className="min-h-[300px]">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {skill.name}
          <Badge variant={skill.is_builtin ? "default" : "secondary"}>
            {skill.is_builtin ? "内置" : "自建"}
          </Badge>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {skill.description ?? skill.applicable_scenarios ?? "未填写适用场景"}
        </CardDescription>
        <CardAction>
          <Badge variant={skill.enabled ? "secondary" : "outline"}>
            {skill.enabled ? "启用中" : "未启用"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoBlock icon={SlidersHorizontal} label="策略" value={skill.prompt_snippet} />
        <InfoBlock icon={ShieldCheck} label="禁忌" value={skill.forbidden_rules} />
        <div className="flex flex-wrap gap-2">
          {skill.available_tools.length ? (
            skill.available_tools.map((tool) => (
              <Badge className="max-w-full truncate" key={tool} title={tool} variant="outline">
                {tool}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">不限制工具</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto gap-2">
        <Button
          className="flex-1"
          disabled={submitting}
          onClick={() => onToggle(!skill.enabled)}
          type="button"
          variant={skill.enabled ? "outline" : "default"}
        >
          {skill.enabled ? <X /> : <Check />}
          {skill.enabled ? "停用" : "启用"}
        </Button>
        {!skill.is_builtin ? (
          <Button disabled={submitting} onClick={onDelete} type="button" variant="destructive">
            <Trash2 />
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-lg border bg-muted/35 px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 line-clamp-3 break-words text-sm leading-6">
        {value || "未设置"}
      </p>
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "h-8 rounded-md px-3 text-sm font-medium transition",
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium">
      <Icon className="size-4" />
      {label}
      <span className="text-muted-foreground">{value}</span>
    </span>
  )
}

function compactOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function parseTools(value: string) {
  return value
    .split(/[\n,，]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}
