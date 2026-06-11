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
  "动作|周几|训练内容|主要动作|说明|组数|次数|次数/时长|休息|备注|餐次|项目|指标|日期|部位|食物|菜品|估算重量|估算分量|热量|蛋白质|脂肪|碳水|置信度|类别|缺失项|影响|原因|建议|风险|边界|可用资源|基础身份|目标导向|身体数据|训练结构|计划可行性"
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
  "当前目标与关键数据摘要",
  "当前状态摘要",
  "个人基础信息",
  "今日训练方案",
  "今日训练安排",
  "今日下肢训练安排",
  "下肢训练安排",
  "今日上肢训练安排",
  "上肢训练安排",
  "恢复训练安排",
  "今日必须完成事项",
  "下周训练计划优化建议",
  "下周周期计划",
  "执行要点",
  "下一步需你确认的信息",
  "营养协同建议",
  "卤味盖饭营养估算",
  "分项营养估算表",
  "关键不确定性说明",
  "下一步建议",
  "当前无法生成可靠训练计划的原因",
  "快速填写",
  "示例",
]

const components: Components = {
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium break-words text-foreground underline decoration-foreground/25 underline-offset-4 transition hover:decoration-foreground",
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
        "my-4 border-l-4 border-border bg-muted/35 py-1.5 pr-3 pl-4 text-[15px] leading-7 text-muted-foreground [&_p]:my-1",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-[5px] bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-7 mb-3 text-[24px] leading-8 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-6 mb-2.5 text-[20px] leading-7 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-5 mb-2 text-[17px] leading-7 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-4 mb-1.5 text-[15px] leading-6 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn("my-6 border-border", className)}
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
    <li
      className={cn("pl-1 leading-7 marker:text-muted-foreground", className)}
      {...markdownProps(props)}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-3 list-decimal space-y-1.5 pl-6", className)}
      {...markdownProps(props)}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("my-3 leading-[1.78] first:mt-0 last:mb-0", className)}
      {...markdownProps(props)}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-[8px] border border-border bg-muted/70 p-4 text-[13px] leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] [&_code]:bg-transparent [&_code]:p-0",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 max-w-full overflow-x-auto rounded-[8px] border border-border">
      <table
        className={cn(
          "min-w-full border-separate border-spacing-0 text-left text-[14px] leading-6",
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
        "max-w-[24rem] border-t border-border px-3.5 py-2.5 align-top break-words",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "bg-muted/80 px-3.5 py-2.5 align-top font-semibold whitespace-nowrap text-foreground",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-3 list-disc space-y-1.5 pl-6", className)}
      {...markdownProps(props)}
    />
  ),
}

export function MarkdownMessage({ children, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "markdown-message min-w-0 text-[15.5px] leading-[1.78] break-words text-foreground [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_strong]:font-semibold",
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
    normalizeCollapsedTables(
      normalizeSingleCellTableArtifacts(normalizeHeadingSyntax(markdown))
    )
  )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n\n$2")
    .replace(/([^\n])\s*(#{2,6})(?!#)(?=\S)/g, "$1\n\n$2 ")
    .replace(
      /([^\n])\s*-\s*(?=(?:性别|年龄|身高|体重|训练目标|训练经验|器械条件|每次训练时长|每周可训练天数|近期状态)[：:])/g,
      "$1\n"
    )
    .replace(
      /([^\n])\s+(?=(?:性别|年龄|身高|体重|训练目标|训练经验|器械条件|每次训练时长|每周可训练天数|近期状态)[：:])/g,
      "$1\n"
    )
    .replace(/^个人基础信息$/gm, "## 个人基础信息")
    .replace(/([。！？!?])\s*(#{1,6})(?=\S)/g, "$1\n\n$2 ")
    .replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n\n$2")
    .replace(/([。！？!?；;：:])\s*([-*+]\s*)/g, "$1\n$2")
    .replace(/([。！？!?；;：:])\s*(\d+[.)、]\s+)/g, "$1\n$2")
    .replace(/([\u4e00-\u9fffA-Za-z）)_%％])\s*(\d+[.)、]\s+)/g, "$1\n$2")
    .replace(/([）)])\s*([-*+]\s*)/g, "$1\n$2")
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

function normalizeSingleCellTableArtifacts(markdown: string) {
  return markdown.replace(
    /^(\s*)\|\s*(?!:?-{3,}:?\s*\|?\s*$)([^|\n]+?)\s*\|?\s*$/gm,
    "$1$2"
  )
}

function normalizeHeadingSyntax(markdown: string) {
  return markdown
    .replace(/([^\n])\s+(#{1,6}\s+)/g, "$1\n\n$2")
    .split("\n")
    .flatMap((line) => splitKnownHeadingBody(cleanHeadingMarkers(line)))
    .join("\n")
}

function cleanHeadingMarkers(line: string) {
  return line
    .replace(/^(\s*#{1,6})(?!#)(?=\S)/, "$1 ")
    .replace(/^(\s*#{1,6})\s+(?:#\s*)+/, "$1 ")
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
  return stripUnmatchedStrongMarkers(line)
    .replace(/^(\s*#{1,6})(?!#)(?=\S)/, "$1 ")
    .replace(/^(\s*#{1,6})\s+(?:#\s*)+/, "$1 ")
    .replace(
      /^(\s*(?:#{1,6}\s*)?(?:今日训练|今日计划|训练安排|恢复训练|示例方案|通用方案))\s*[|｜]\s*(?=\S)/,
      "$1："
    )
    .replace(/^(\s*)(?:[-*+•·]\s*){2,}$/, "")
    .replace(/^(\s*)[:：]\s+(?=\S)/, "$1")
    .replace(/^(\s*)[:：](?=\S)/, "$1")
    .replace(/^(\s*)(?:[-*+•·]\s+){2,}(?=\S)/, "$1- ")
    .replace(/^(\s*)[•·]\s*/, "$1- ")
    .replace(/^(\s*[-*+])(?=\S)/, "$1 ")
    .replace(/([A-Za-z0-9\u4e00-\u9fff）)])\s*>\s*(?=(?:🔐|✅|⚠️?|📌|📋)|[\u4e00-\u9fff])/gu, "$1 ")
    .replace(/^\s*[-*+]\s*$/, "")
    .replace(/\s+>\s*$/, "")
}

function normalizeCollapsedTables(markdown: string) {
  const output: string[] = []
  const lines = markdown.split("\n").flatMap(expandMaybeTableLine)
  let index = 0

  while (index < lines.length) {
    if (!isTableBlockStart(lines[index], lines[index + 1])) {
      output.push(lines[index])
      index += 1
      continue
    }

    const block: string[] = []
    while (index < lines.length) {
      const line = lines[index]
      if (block.length > 0 && isTableBlockBoundary(line) && !isSeparatorLine(line)) {
        break
      }
      if (
        isTableLikeLine(line) ||
        (block.length > 0 && (isSeparatorLine(line) || isTableContinuationLine(line)))
      ) {
        block.push(line)
        index += 1
        continue
      }
      break
    }

    if (block.length) {
      output.push(...normalizeTableBlock(block))
    } else {
      output.push(lines[index])
      index += 1
    }
  }

  return output.join("\n")
}

function expandMaybeTableLine(line: string): string[] {
  const splitLine = splitGluedTableStart(normalizeTableSourceLine(line))
  if (splitLine.includes("\n")) {
    return splitLine.split("\n").flatMap(expandMaybeTableLine)
  }

  if (!looksLikeTableLine(splitLine)) {
    return [splitLine]
  }

  return normalizeTableLine(splitLine)
}

function splitGluedTableStart(line: string) {
  const normalized = normalizeTableSourceLine(line)
  const cells = tableCells(normalized)
  if (cells.length >= 2 && isKnownHeaderCell(cells[0])) {
    return normalized
  }

  const match = tableStartPattern.exec(normalized)
  if (!match || match.index === 0) {
    return normalized
  }

  const before = normalized.slice(0, match.index).trimEnd()
  const table = normalized.slice(match.index).trimStart()
  return before ? `${before}\n\n${table}` : table
}

function looksLikeTableLine(line: string) {
  const trimmed = normalizeTableSourceLine(line).trim()
  if (!trimmed.includes("|")) {
    return false
  }

  return (
    tableStartPattern.test(trimmed) ||
    hasKnownHeaderRow(trimmed) ||
    /\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?/.test(trimmed) ||
    (/^\|/.test(trimmed) && countPipes(trimmed) >= 2)
  )
}

function isTableBlockStart(line: string, nextLine?: string) {
  const normalized = normalizeTableSourceLine(line).trim()
  if (!looksLikeTableLine(normalized)) {
    return false
  }

  if (tableStartPattern.test(normalized) || hasKnownHeaderRow(normalized)) {
    return true
  }

  return Boolean(nextLine && isSeparatorLine(nextLine))
}

function isTableLikeLine(line: string) {
  const normalized = normalizeTableSourceLine(line).trim()
  return normalized.includes("|") || normalized.includes("｜")
}

function isTableContinuationLine(line: string) {
  const trimmed = line.trim()
  return Boolean(trimmed && /[|｜]/.test(trimmed) && !/^\s*#{1,6}\s+/.test(trimmed))
}

function isTableBlockBoundary(line: string) {
  const trimmed = line.trim()
  return !trimmed || /^\s*#{1,6}\s+/.test(trimmed) || /^-{3,}$/.test(trimmed)
}

function normalizeTableBlock(block: string[]) {
  const expanded = block
    .flatMap((line) => expandMaybeTableLine(line))
    .map((line) => normalizeTableSourceLine(line).trim())
    .filter((line) => line.length > 0)

  const firstRow = expanded.find((line) => !isSeparatorLine(line))
  if (!firstRow) {
    return block
  }

  const columnCount = Math.max(2, tableCells(firstRow).length)
  const rows: string[][] = []
  const overflowLines: string[] = []

  for (let index = 0; index < expanded.length; index += 1) {
    if (isSeparatorLine(expanded[index])) {
      continue
    }

    let candidate = expanded[index]
    while (
      tableCells(candidate).length < columnCount &&
      index + 1 < expanded.length &&
      !isSeparatorLine(expanded[index + 1]) &&
      isTableContinuationLine(expanded[index + 1])
    ) {
      index += 1
      candidate = `${candidate} ${expanded[index]}`
    }

    const rawCells = tableCells(candidate)
    if (rawCells.length >= 2) {
      rows.push(normalizeCellCount(rawCells, columnCount))
      continue
    }

    const overflow = cleanSingleCellTableOverflow(candidate)
    if (overflow) {
      overflowLines.push(overflow)
    }
  }

  if (rows.length === 0) {
    return block
  }

  const tableLines = [
    formatTableCells(rows[0]),
    buildSeparatorRow(rows[0].length),
    ...rows.slice(1).map(formatTableCells),
  ]

  if (overflowLines.length > 0) {
    return [...tableLines, "", ...overflowLines]
  }

  return [...tableLines, ""]
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

function formatTableCells(cells: string[]) {
  return `| ${cells.map(normalizeTableCell).join(" | ")} |`
}

function tableCells(row: string) {
  const trimmed = normalizeTableSourceLine(row).trim()
  if (!trimmed.includes("|")) {
    return []
  }

  return trimmed
    .replace(/^\|+/, "")
    .replace(/\|+$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function cleanSingleCellTableOverflow(row: string) {
  const normalized = normalizeTableSourceLine(row).trim()
  if (!normalized.includes("|")) {
    return normalized
  }
  return normalized.replace(/^\|+/, "").replace(/\|+$/, "").trim()
}

function normalizeCellCount(cells: string[], columnCount: number) {
  if (cells.length === columnCount) {
    return cells
  }
  if (cells.length > columnCount) {
    return [
      ...cells.slice(0, columnCount - 1),
      cells.slice(columnCount - 1).join(" | "),
    ]
  }
  return [...cells, ...Array.from({ length: columnCount - cells.length }, () => "")]
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
  return tableCells(row).some(isKnownHeaderCell)
}

function isKnownHeaderCell(cell: string) {
  return tableHeaderCellPattern.test(normalizeTableCell(cell))
}

function isSeparatorRow(row: string) {
  const cells = tableCells(row)
  return cells.length >= 2 && cells.every(isSeparatorCell)
}

function isSeparatorLine(line: string) {
  const normalized = normalizeTableSourceLine(line)
  return isSeparatorRow(normalized) || isLooseSeparatorLine(normalized)
}

function isSeparatorCell(cell: string) {
  return /^:?-{3,}:?$/.test(cell.trim())
}

function isLooseSeparatorLine(line: string) {
  const trimmed = normalizeTableSourceLine(line).trim()
  return /^\|?\s*:?-{3,}:?\s*\|?\s*$/.test(trimmed)
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

function normalizeTableSourceLine(line: string) {
  return line.replace(/｜/g, "|")
}

function stripUnmatchedStrongMarkers(line: string) {
  let normalized = line
  const strongMarkerCount = normalized.match(/\*\*/g)?.length ?? 0
  if (strongMarkerCount % 2 !== 0) {
    normalized = normalized.replace(/\*\*/g, "")
  }

  const emphasisMarkerCount = normalized.match(/(?<!\*)\*(?!\*)/g)?.length ?? 0
  if (emphasisMarkerCount % 2 !== 0) {
    normalized = normalized.replace(/(?<!\*)\*(?!\*)/g, "")
  }

  return normalized
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
