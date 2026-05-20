import { useState } from "react"
import {
  Download,
  Edit3,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react"

import type { ChatSession } from "@/entities/kratos/model/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"

type ConversationRowProps = {
  active: boolean
  onDelete: () => void
  onExport: () => void
  onRename: (title: string) => void
  onSelect: () => void
  onTogglePin: () => void
  session: ChatSession
}

export function ConversationRow({
  active,
  onDelete,
  onExport,
  onRename,
  onSelect,
  onTogglePin,
  session,
}: ConversationRowProps) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [title, setTitle] = useState(session.title)

  const commitTitle = () => {
    const nextTitle = title.trim()
    if (nextTitle) {
      onRename(nextTitle)
    }
    setEditing(false)
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={onSelect}
        size="default"
        tooltip={session.title}
        type="button"
      >
        {session.pinned && <Pin />}
        {editing ? (
          <input
            autoFocus
            className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            onBlur={commitTitle}
            onChange={(event) => setTitle(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitTitle()
              }

              if (event.key === "Escape") {
                setEditing(false)
                setTitle(session.title)
              }
            }}
            value={title}
          />
        ) : (
          <span className="truncate">{ellipsis(session.title, 13)}</span>
        )}
      </SidebarMenuButton>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction aria-label="对话操作" showOnHover type="button">
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuItem onClick={onTogglePin}>
            {session.pinned ? <PinOff /> : <Pin />}
            {session.pinned ? "取消置顶" : "置顶"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download />
            导出 JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTitle(session.title)
              setEditing(true)
            }}
          >
            <Edit3 />
            重命名
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function ellipsis(text: string, max = 16) {
  if (!text) {
    return ""
  }

  return text.length > max ? `${text.slice(0, max)}...` : text
}
