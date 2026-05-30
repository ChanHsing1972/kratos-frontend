import type { ChangeEvent, ComponentProps, FormEvent } from "react"
import { Camera, LoaderCircle } from "lucide-react"

import { absoluteApiUrl } from "@/entities/kratos/api/client"
import type { ProfileForm, UserProfile } from "@/entities/kratos/model/types"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

export type ProfileDialogMode = "personal" | "training" | null

type ProfileEditDialogProps = {
  activeDialog: ProfileDialogMode
  avatarUploading: boolean
  form: ProfileForm
  loading: boolean
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClose: () => void
  onFieldChange: (field: keyof ProfileForm, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  profileError: string | null
  user: UserProfile | null
}

export function ProfileEditDialog({
  activeDialog,
  avatarUploading,
  form,
  loading,
  onAvatarChange,
  onClose,
  onFieldChange,
  onSubmit,
  profileError,
  user,
}: ProfileEditDialogProps) {
  const avatarSrc = user?.avatar_url ? absoluteApiUrl(user.avatar_url) : undefined

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
              <div className="flex justify-center">
                <label className="group relative block cursor-pointer">
                  <Avatar className="size-20 sm:size-30">
                    <AvatarImage src={avatarSrc} alt={user?.username ?? "avatar"} />
                    <AvatarFallback className="text-3xl">
                      {getUserInitials(user?.username ?? "")}
                    </AvatarFallback>
                  </Avatar>

                  <span className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full border border-border bg-background transition-colors group-hover:bg-muted">
                    {avatarUploading ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </span>

                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={avatarUploading}
                    onChange={onAvatarChange}
                    type="file"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <ProfileInput
                  label="性别"
                  onChange={(value) => onFieldChange("gender", value)}
                  placeholder="性别"
                  value={form.gender}
                />
                <ProfileInput
                  label="年龄"
                  max={120}
                  min={0}
                  onChange={(value) => onFieldChange("age", value)}
                  placeholder="年龄"
                  type="number"
                  value={form.age}
                />
                <ProfileInput
                  label="地区"
                  onChange={(value) => onFieldChange("location", value)}
                  placeholder="地区"
                  value={form.location}
                />
              </div>
              <ProfileTextarea
                label="医疗情况"
                onChange={(value) => onFieldChange("medicalConditions", value)}
                placeholder="是否有高血压、糖尿病等需要注意的健康问题"
                value={form.medicalConditions}
              />
              <ProfileTextarea
                label="饮食习惯"
                onChange={(value) => onFieldChange("dietaryHabits", value)}
                placeholder="您的饮食偏好，例如素食、低碳水、间歇性禁食等"
                value={form.dietaryHabits}
              />
              <ProfileTextarea
                label="饮食限制"
                onChange={(value) => onFieldChange("dietaryRestrictions", value)}
                placeholder="是否有食物过敏、需要避免的食物等"
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
            <DialogTitle>训练档案</DialogTitle>
            <DialogDescription>您的训练目标、经验、器械和限制条件。</DialogDescription>
          </DialogHeader>

          <form id="sidebar-training-form" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileInput
                  label="活动水平"
                  onChange={(value) => onFieldChange("activityLevel", value)}
                  placeholder="久坐 / 中等 / 活跃"
                  value={form.activityLevel}
                />
                <ProfileInput
                  label="训练经验"
                  onChange={(value) => onFieldChange("experienceLevel", value)}
                  placeholder="新手 / 中级 / 高级"
                  value={form.experienceLevel}
                />
                <ProfileInput
                  label="每周可练天数"
                  max={7}
                  min={0}
                  placeholder="每周可练天数"
                  onChange={(value) =>
                    onFieldChange("availableDaysPerWeek", value)
                  }
                  type="number"
                  value={form.availableDaysPerWeek}
                />
                <ProfileInput
                  label="单次训练时长 (分钟)"
                  min={0}
                  onChange={(value) =>
                    onFieldChange("workoutMinutesPerSession", value)
                  }
                  type="number"
                  placeholder="单次训练时长"
                  value={form.workoutMinutesPerSession}
                />
                <ProfileInput
                  label="可用器械"
                  onChange={(value) => onFieldChange("equipmentAccess", value)}
                  placeholder="哑铃、跑步机…"
                  value={form.equipmentAccess}
                />
                <ProfileInput
                  label="偏好训练"
                  onChange={(value) =>
                    onFieldChange("preferredWorkoutTypes", value)
                  }
                  placeholder="跑步、瑜伽…"
                  value={form.preferredWorkoutTypes}
                />
              </div>
              <ProfileInput
                label="健身目标"
                onChange={(value) => onFieldChange("fitnessGoal", value)}
                placeholder="减脂 / 增肌 / 塑形"
                value={form.fitnessGoal}
              />
              <ProfileTextarea
                label="当前训练状态"
                onChange={(value) => onFieldChange("fitnessSummary", value)}
                placeholder="您目前的训练情况、遇到的挑战"
                value={form.fitnessSummary}
              />
              <ProfileTextarea
                label="伤病史"
                onChange={(value) => onFieldChange("injuryHistory", value)}
                placeholder="过去的伤病情况，可能影响训练的健康问题"
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

function getUserInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "KR"
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
