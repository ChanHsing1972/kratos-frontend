import type { ComponentProps, FormEvent } from "react"
import { LoaderCircle } from "lucide-react"

import type { ProfileForm } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Field, FieldGroup } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

export type ProfileDialogMode = "personal" | "training" | null

type ProfileEditDialogProps = {
  activeDialog: ProfileDialogMode
  form: ProfileForm
  loading: boolean
  onClose: () => void
  onFieldChange: (field: keyof ProfileForm, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  profileError: string | null
}

export function ProfileEditDialog({
  activeDialog,
  form,
  loading,
  onClose,
  onFieldChange,
  onSubmit,
  profileError,
}: ProfileEditDialogProps) {
  return (
    <>
      <Dialog
        open={activeDialog === "personal"}
        onOpenChange={(open) => {
          if (!open) {
            onClose()
          }
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>个人信息</DialogTitle>
            <DialogDescription>您的基础信息、健康和饮食偏好。</DialogDescription>
          </DialogHeader>

          <form id="sidebar-personal-form" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-3">
                <ProfileInput
                  label="性别"
                  onChange={(value) => onFieldChange("gender", value)}
                  placeholder="男/女"
                  value={form.gender}
                />
                <ProfileInput
                  label="年龄"
                  max={120}
                  min={0}
                  onChange={(value) => onFieldChange("age", value)}
                  placeholder=""
                  type="number"
                  value={form.age}
                />
                <ProfileInput
                  label="地区"
                  onChange={(value) => onFieldChange("location", value)}
                  placeholder=""
                  value={form.location}
                />
              </div>
              <ProfileTextarea
                label="医疗情况"
                onChange={(value) => onFieldChange("medicalConditions", value)}
                placeholder="例如 无 / 高血压 / 哮喘"
                value={form.medicalConditions}
              />
              <ProfileTextarea
                label="饮食习惯"
                onChange={(value) => onFieldChange("dietaryHabits", value)}
                placeholder="例如 高蛋白、少糖、乳糖不耐受"
                value={form.dietaryHabits}
              />
              <ProfileTextarea
                label="饮食限制"
                onChange={(value) => onFieldChange("dietaryRestrictions", value)}
                placeholder="例如 乳糖不耐受、海鲜过敏、不吃牛肉"
                value={form.dietaryRestrictions}
              />
              {profileError ? (
                <DialogDescription role="alert">{profileError}</DialogDescription>
              ) : null}
            </FieldGroup>
          </form>

          <ProfileDialogFooter
            formId="sidebar-personal-form"
            loading={loading}
            onCancel={onClose}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={activeDialog === "training"}
        onOpenChange={(open) => {
          if (!open) {
            onClose()
          }
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>训练数据</DialogTitle>
            <DialogDescription>您的训练目标、经验、器械和限制条件。</DialogDescription>
          </DialogHeader>

          <form id="sidebar-training-form" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-3">
                <ProfileInput
                  label="活动水平"
                  onChange={(value) => onFieldChange("activityLevel", value)}
                  placeholder="例如 久坐 / 中等 / 高"
                  value={form.activityLevel}
                />
                <ProfileInput
                  label="训练经验"
                  onChange={(value) => onFieldChange("experienceLevel", value)}
                  placeholder="例如 新手 / 中级"
                  value={form.experienceLevel}
                />
                <ProfileInput
                  label="每周可练天数"
                  max={7}
                  min={0}
                  onChange={(value) =>
                    onFieldChange("availableDaysPerWeek", value)
                  }
                  placeholder="例如 4"
                  type="number"
                  value={form.availableDaysPerWeek}
                />
                <ProfileInput
                  label="单次训练时长 (分钟)"
                  min={0}
                  onChange={(value) =>
                    onFieldChange("workoutMinutesPerSession", value)
                  }
                  placeholder="例如 45"
                  type="number"
                  value={form.workoutMinutesPerSession}
                />
                <ProfileInput
                  label="可用器械"
                  onChange={(value) => onFieldChange("equipmentAccess", value)}
                  placeholder="例如 健身房、哑铃、弹力带"
                  value={form.equipmentAccess}
                />
                <ProfileInput
                  label="偏好训练"
                  onChange={(value) =>
                    onFieldChange("preferredWorkoutTypes", value)
                  }
                  placeholder="例如 力量训练、跑步、瑜伽"
                  value={form.preferredWorkoutTypes}
                />
              </div>
              <ProfileInput
                label="健身目标"
                onChange={(value) => onFieldChange("fitnessGoal", value)}
                placeholder="例如 减脂 / 增肌 / 塑形"
                value={form.fitnessGoal}
              />
              <ProfileTextarea
                label="当前训练状态"
                onChange={(value) => onFieldChange("fitnessSummary", value)}
                placeholder="例如 近期恢复一般，想先提升基础力量"
                value={form.fitnessSummary}
              />
              <ProfileTextarea
                label="伤病史"
                onChange={(value) => onFieldChange("injuryHistory", value)}
                placeholder="例如 右膝偶尔不适，避免跳跃"
                value={form.injuryHistory}
              />
              {profileError ? (
                <DialogDescription role="alert">{profileError}</DialogDescription>
              ) : null}
            </FieldGroup>
          </form>

          <ProfileDialogFooter
            formId="sidebar-training-form"
            loading={loading}
            onCancel={onClose}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProfileDialogFooter({
  formId,
  loading,
  onCancel,
}: {
  formId: string
  loading: boolean
  onCancel: () => void
}) {
  return (
    <DialogFooter>
      <Button onClick={onCancel} type="button" variant="outline">
        取消
      </Button>
      <Button disabled={loading} form={formId} type="submit">
        {loading ? <LoaderCircle className="animate-spin" /> : null}
        保存更新
      </Button>
    </DialogFooter>
  )
}

function ProfileInput({
  label,
  onChange,
  value,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange" | "value"> & {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const id = `profile-${label}`

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
  )
}

function ProfileTextarea({
  label,
  onChange,
  value,
  ...props
}: Omit<ComponentProps<typeof Textarea>, "onChange" | "value"> & {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const id = `profile-${label}`

  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </Field>
  )
}
