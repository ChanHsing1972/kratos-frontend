import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/shared/lib/utils"

type MarkdownMessageProps = {
  className?: string
  children: string
}

function markdownProps<T extends { node?: unknown }>(
  props: T
): Omit<T, "node"> {
  const next = { ...props }
  delete next.node
  return next
}

const tableHeaderWords =
  "动作|周几|训练内容|餐次|项目|指标|日期|部位|食物|菜品|估算重量|估算分量|热量|蛋白质|脂肪|碳水"
const tableStartPattern = new RegExp(
  `\\|\\s*(?:${tableHeaderWords})\\s*\\|`,
  "i"
)
const tableHeaderCellPattern = new RegExp(
  `^(?:${tableHeaderWords})(?:\\s*[（(][^）)]*[）)])?$`,
  "i"
)
const tableRowStartChars = "[\\u4e00-\\u9fffA-Za-z0-9（(*_`-]"
const knownHeadingTitles = [
  "当前状态摘要",
  "今日训练方案",
  "恢复训练安排",
  "今日必须完成事项",
  "下周训练计划优化建议",
  "执行要点",
  "下一步需你确认的信息",
]

const components: Components = {
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-semibold break-words text-foreground underline decoration-foreground/30 underline-offset-4 transition hover:decoration-foreground",
        className
      )}
      rel="noreferrer"
      target="_blank"
      {...markdownProps(props)}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-5 mb-2 text-[18px] leading-6 font-black", className)}
      {...markdownProps(props)}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-4 mb-2 text-[16px] leading-6 font-bold", className)}
      {...markdownProps(props)}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-3 mb-1.5 text-[14px] leading-5 font-bold", className)}
      {...markdownProps(props)}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-3 mb-1 text-[13px] leading-5 font-bold", className)}
      {...markdownProps(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn("my-4 border-border", className)}
      {...markdownProps(props)}
    />
  ),
  input: ({ className, ...props }) => (
    <input
      className={cn("mr-2 align-[-1px] accent-primary", className)}
      {...markdownProps(props)}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("pl-1 leading-6", className)} {...markdownProps(props)} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-2 list-decimal space-y-1 pl-5", className)}
      {...markdownProps(props)}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("my-2 leading-[1.72] first:mt-0 last:mb-0", className)}
      {...markdownProps(props)}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-[8px] bg-muted p-3 text-[12px] leading-5",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-3 max-w-full overflow-x-auto">
      <table
        className={cn(
          "min-w-full border-collapse border border-border text-left text-[12px] leading-5",
          className
        )}
        {...markdownProps(props)}
      />
    </div>
  ),
  tbody: ({ className, ...props }) => (
    <tbody className={className} {...markdownProps(props)} />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "max-w-[18rem] border border-border px-2.5 py-1.5 align-top break-words",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border border-border bg-muted/70 px-2.5 py-1.5 align-top font-bold whitespace-nowrap",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-2 list-disc space-y-1 pl-5", className)}
      {...markdownProps(props)}
    />
  ),
}

export function MarkdownMessage({ children, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "markdown-message min-w-0 text-sm leading-[1.72] break-words text-foreground [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {normalizeModelMarkdown(children)}
      </ReactMarkdown>
    </div>
  )
}

function normalizeModelMarkdown(markdown: string) {
  const source = markdown.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ")
  const parts = source.split(/(```[\s\S]*?```)/g)

  return parts
    .map((part) => {
      if (part.startsWith("```")) {
        return part
      }
      return normalizePlainMarkdown(part)
    })
    .join("")
    .trim()
}

function normalizePlainMarkdown(markdown: string) {
  return normalizeLooseBlockSyntax(
    normalizeCollapsedTables(normalizeHeadingSyntax(markdown))
  )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/([。！？!?])\s*(#{1,6})(?=\S)/g, "$1\n\n$2 ")
    .replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n\n$2")
    .replace(/([。！？!?；;：:])\s*([-*+]\s+)/g, "$1\n$2")
    .replace(/([。！？!?；;：:])\s*(\d+[.)、]\s+)/g, "$1\n$2")
    .replace(/([）)])\s*([-*+]\s+)/g, "$1\n$2")
    .replace(
      /([\u4e00-\u9fffA-Za-z0-9）)]{2,32})\s*[-*]\s+(?=\S)/g,
      "$1\n- "
    )
    .replace(/([^\n])---(?=\n|$)/g, "$1\n\n---")
    .split("\n")
    .map(normalizeLineMarkdown)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
}

function normalizeHeadingSyntax(markdown: string) {
  return markdown
    .split("\n")
    .flatMap((line) => splitKnownHeadingBody(cleanHeadingMarkers(line)))
    .join("\n")
}

function cleanHeadingMarkers(line: string) {
  return line.replace(/^(\s*#{1,6})\s+(?:#\s*)+/, "$1 ")
}

function splitKnownHeadingBody(line: string) {
  if (!/^\s*#{1,6}\s+/.test(line)) {
    return [line]
  }

  for (const title of knownHeadingTitles) {
    const escapedTitle = escapeRegExp(title)
    const pattern = new RegExp(
      `^(\\s*#{1,6}\\s+.*?${escapedTitle}(?:[（(][^）)]*[）)])?)(\\S[\\s\\S]*)$`
    )
    const match = pattern.exec(line)
    if (match) {
      return [match[1].trimEnd(), "", match[2].trimStart()]
    }
  }

  return [line]
}

function normalizeLooseBlockSyntax(markdown: string) {
  return markdown
    .replace(/[ \t]+\n/g, "\n")
    .replace(/(^|\n)\s*>\s*/g, "$1")
    .replace(/([：:。！？!?；;])\s*>\s*(?=[-*+]\s+)/g, "$1\n")
    .replace(/([\u4e00-\u9fff）)。！？!?；;：:])\s*>\s*(?=\S)/g, "$1\n\n")
    .replace(/([^\n])\s+(>\s*[-*+]\s+)/g, "$1\n$2")
    .replace(/(^|\n)\s*>\s*(?=[-*+]\s+)/g, "$1")
    .replace(/([：:])\s*>\s*(?=\n|$)/g, "$1")
    .replace(/([\u4e00-\u9fffA-Za-z0-9）)。！？!?；;，,、])\s*>\s*(?=\n|$)/g, "$1")
    .replace(/(^|\n)\s*>\s*$/g, "$1")
}

function normalizeLineMarkdown(line: string) {
  return line
    .replace(/^(\s*#{1,6})\s+(?:#\s*)+/, "$1 ")
    .replace(/^\s*[-*+]\s*$/, "")
    .replace(/\s+>\s*$/, "")
}

function normalizeCollapsedTables(markdown: string) {
  const lines: string[] = []

  for (const line of markdown.split("\n")) {
    lines.push(...expandMaybeTableLine(line))
  }

  return lines.join("\n")
}

function expandMaybeTableLine(line: string): string[] {
  const splitLine = splitGluedTableStart(line)
  if (splitLine.includes("\n")) {
    return splitLine.split("\n").flatMap(expandMaybeTableLine)
  }

  if (!looksLikeTableLine(splitLine)) {
    return [splitLine]
  }

  return normalizeTableLine(splitLine)
}

function splitGluedTableStart(line: string) {
  const match = tableStartPattern.exec(line)
  if (!match || match.index === 0) {
    return line
  }

  const before = line.slice(0, match.index).trimEnd()
  const table = line.slice(match.index).trimStart()
  return before ? `${before}\n\n${table}` : table
}

function looksLikeTableLine(line: string) {
  const trimmed = line.trim()
  if (!trimmed.includes("|")) {
    return false
  }

  return (
    tableStartPattern.test(trimmed) ||
    /\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?/.test(trimmed) ||
    (/^\|/.test(trimmed) && countPipes(trimmed) >= 2)
  )
}

function normalizeTableLine(line: string) {
  const hadCollapsedRows =
    /\|{2,}/.test(line) ||
    /\s+\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?/.test(line)
  const splitRows = line
    .trim()
    .replace(/\|{2,}\s*(?=:?-{3,}:?\s*(?:\||$))/g, "|\n|")
    .replace(new RegExp(`\\|{2,}\\s*(?=${tableRowStartChars})`, "g"), "|\n|")
    .replace(
      /\s+(\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?)/g,
      "\n$1"
    )
    .replace(new RegExp(`(\\|)\\s+(?=\\|\\s*${tableRowStartChars})`, "g"), "$1\n")
    .split("\n")
    .map(formatTableRow)
    .filter((row) => row.length > 0)

  if (splitRows.length === 0) {
    return [line]
  }

  if (
    hadCollapsedRows &&
    splitRows.length >= 2 &&
    hasKnownHeaderRow(splitRows[0]) &&
    !isSeparatorRow(splitRows[1])
  ) {
    splitRows.splice(1, 0, buildSeparatorRow(cellCount(splitRows[0])))
  }

  return splitRows
}

function formatTableRow(row: string) {
  const cells = tableCells(row)
  if (cells.length < 2) {
    return row.trim()
  }

  if (cells.every(isSeparatorCell)) {
    return `| ${cells.map(normalizeSeparatorCell).join(" | ")} |`
  }

  return `| ${cells.map(normalizeTableCell).join(" | ")} |`
}

function tableCells(row: string) {
  const trimmed = row.trim()
  if (!trimmed.includes("|")) {
    return []
  }

  return trimmed
    .replace(/^\|+/, "")
    .replace(/\|+$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function normalizeTableCell(cell: string) {
  return cell
    .replace(/\s*<br\s*\/?>\s*[-•]\s*/gi, "；")
    .replace(/\s*<br\s*\/?>\s*/gi, "；")
    .replace(/\s*•\s*/g, "；")
    .replace(/；{2,}/g, "；")
    .replace(/：；/g, "：")
    .replace(/\s+/g, " ")
    .replace(/\s*；\s*/g, "；")
    .replace(/；$/g, "")
    .trim()
}

function hasKnownHeaderRow(row: string) {
  return tableCells(row).some((cell) =>
    tableHeaderCellPattern.test(normalizeTableCell(cell))
  )
}

function isSeparatorRow(row: string) {
  const cells = tableCells(row)
  return cells.length >= 2 && cells.every(isSeparatorCell)
}

function isSeparatorCell(cell: string) {
  return /^:?-{3,}:?$/.test(cell.trim())
}

function normalizeSeparatorCell(cell: string) {
  const trimmed = cell.trim()
  if (trimmed.startsWith(":") && trimmed.endsWith(":")) {
    return ":---:"
  }
  if (trimmed.startsWith(":")) {
    return ":---"
  }
  if (trimmed.endsWith(":")) {
    return "---:"
  }
  return "---"
}

function buildSeparatorRow(count: number) {
  return `| ${Array.from({ length: count }, () => "---").join(" | ")} |`
}

function cellCount(row: string) {
  return tableCells(row).length
}

function countPipes(value: string) {
  return value.split("|").length - 1
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
