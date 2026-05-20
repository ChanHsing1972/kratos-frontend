import { useState, type FormEvent } from "react"

import type { AuthForm, AuthMode } from "@/entities/kratos/model/types"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
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

type AuthModalProps = {
  error: string | null
  loading: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (form: AuthForm) => void
  open: boolean
}

export function AuthModal({
  error,
  loading,
  mode,
  onClose,
  onModeChange,
  onSubmit,
  open,
}: AuthModalProps) {
  const [form, setForm] = useState<AuthForm>({
    username: "",
    password: "",
  })
  const [agreed, setAgreed] = useState(false)

  if (!open) {
    return null
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(form)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm pt-5">
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {mode === "login" ? "登录 Kratos" : "创建 Kratos 账号"}
          </DialogTitle>
          <DialogDescription>让健身更智能，让训练更高效</DialogDescription>
        </DialogHeader>
        <form id="auth-form" onSubmit={submit}>
          <FieldGroup>
            <Field>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                minLength={3}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder={mode === "login" ? "输入您的用户名" : "至少 3 个字符"}
                required
                value={form.username}
              />
            </Field>
            <Field>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                minLength={6}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder={mode === "login" ? "输入您的密码" : "至少 6 个字符"}
                required
                type="password"
                value={form.password}
              />
            </Field>
            <Field
              orientation="horizontal"
              className="text-sm text-muted-foreground"
            >
              <Checkbox
                checked={agreed}
                id="terms-checkbox-2"
                name="terms-checkbox-2"
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              我已阅读并同意《用户协议》和《隐私政策》
            </Field>
            {error ? (
              <Field>
                <DialogDescription role="alert" className="text-red-600">
                  {error}
                </DialogDescription>
              </Field>
            ) : null}
          </FieldGroup>
        </form>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0 ">
          <Button disabled={loading || !agreed} form="auth-form" type="submit">
            {loading ? "加载中..." : mode === "login" ? "登录" : "注册并登录"}
          </Button>
          <Button
            onClick={() =>
              onModeChange(mode === "login" ? "register" : "login")
            }
            type="button"
            variant="outline"
          >
            {mode === "login" ? "注册" : "登录"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
