import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/shared/lib/utils"

type MarkdownMessageProps = {
  className?: string
  children: string
}

function cleanMarkdownProps<T extends { node?: unknown }>(
  props: T
): Omit<T, "node"> {
  const cleanProps = { ...props }
  delete cleanProps.node
  return cleanProps
}

const markdownComponents: Components = {
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium break-all text-foreground underline decoration-foreground/30 underline-offset-3 transition-colors hover:decoration-foreground",
        className
      )}
      rel="noreferrer"
      target="_blank"
      {...cleanMarkdownProps(props)}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-border pl-3 text-muted-foreground",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-[6px] bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-5 mb-2 text-[18px] leading-6 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-4 mb-2 text-[16px] leading-6 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-3 mb-1.5 text-[14px] leading-5 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn("my-4 border-border", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  input: ({ className, ...props }) => (
    <input
      className={cn("mr-2 align-[-1px] accent-primary", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("pl-1", className)} {...cleanMarkdownProps(props)} />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-2 list-decimal space-y-1 pl-5", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("my-2 leading-[1.7] first:mt-0 last:mb-0", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-3 overflow-x-auto rounded-[10px] bg-muted px-3 py-2 text-[12px] leading-5",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-3 max-w-full overflow-x-auto rounded-[8px] border border-border">
      <table
        className={cn(
          "w-max min-w-full border-collapse text-left text-[12px] leading-5",
          className
        )}
        {...cleanMarkdownProps(props)}
      />
    </div>
  ),
  tbody: ({ className, ...props }) => (
    <tbody
      className={cn("divide-y divide-border", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "min-w-24 border border-border px-2.5 py-1.5 align-top",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "min-w-24 border border-border bg-muted/70 px-2.5 py-1.5 align-top font-semibold whitespace-nowrap",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-2 list-disc space-y-1 pl-5", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
}

export function MarkdownMessage({ children, className }: MarkdownMessageProps) {
  const normalizedMarkdown = normalizeMarkdownForRendering(children)

  return (
    <div
      className={cn(
        "markdown-message min-w-0 leading-[1.7] wrap-break-word text-foreground [&>:first-child]:mt-0 [&>:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {normalizedMarkdown}
      </ReactMarkdown>
    </div>
  )
}

function normalizeMarkdownForRendering(markdown: string) {
  let text = markdown.replace(/\r\n/g, "\n").trim()

  text = splitGluedTableHeaders(text)

  // Repair common LLM output where a table header is glued to the preceding
  // sentence, e.g. "今日训练安排| 动作 | 组数 |".
  text = text.replace(
    /([^\n])(\|\s*(?:动作|周几|训练内容|餐次|项目|指标|日期|部位|食物|估算分量|热量|蛋白质|脂肪|碳水)\s*\|)/g,
    "$1\n$2"
  )

  text = splitGluedTableRows(text)

  // Put GFM separator rows on their own line.
  text = text.replace(
    /\s+(\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?)/g,
    "\n$1"
  )
  text = text.split("\n").map(splitTrailingTextAfterTableRow).join("\n")

  // Some answers glue a new section heading or list directly after a sentence.
  text = text.replace(/([。.!?])\s*(#{2,6})(?=\S)/g, "$1\n\n$2 ")
  text = text.replace(/([。.!?])\s*(#{2,6}\s+)/g, "$1\n\n$2")
  text = text.replace(/([^\n])\s+(#{2,6})(?=\S)/g, "$1\n\n$2 ")
  text = text.replace(/([^\n])\s+(#{2,6}\s+)/g, "$1\n\n$2")
  text = text.replace(
    /([\u4e00-\u9fffA-Za-z0-9]{2,30})-\s+(?=[\u4e00-\u9fffA-Za-z])/g,
    "$1\n- "
  )
  text = text.replace(/([^\n])([。.!?])\s*-\s+(?=[^\n])/g, "$1$2\n- ")
  text = text.replace(/([^\n])\s+-\s+(?=[\u4e00-\u9fffA-Za-z])/g, "$1\n- ")

  return text
}

function splitGluedTableHeaders(markdown: string) {
  const lines = markdown.split("\n")

  return lines
    .map((line, index) => {
      const pipeIndex = line.indexOf("|")
      if (pipeIndex <= 0 || line.trimStart().startsWith("|")) {
        return line
      }

      const prefix = line.slice(0, pipeIndex).trimEnd()
      const tableRow = line.slice(pipeIndex).trim()
      const nextLine = lines[index + 1]?.trim() ?? ""

      if (
        prefix &&
        isLikelyMarkdownTableRow(tableRow) &&
        (isMarkdownTableSeparator(nextLine) || hasKnownTableHeader(tableRow))
      ) {
        return `${prefix}\n${tableRow}`
      }

      return line
    })
    .join("\n")
}

function isLikelyMarkdownTableRow(value: string) {
  const pipeCount = value.split("|").length - 1
  return pipeCount >= 2 && /^\|.*\|?\s*$/.test(value)
}

function isMarkdownTableSeparator(value: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(value)
}

function hasKnownTableHeader(value: string) {
  return /(?:动作|周几|训练内容|餐次|项目|指标|日期|部位|食物|估算分量|热量|蛋白质|脂肪|碳水)/.test(
    value
  )
}

function splitGluedTableRows(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.trimStart().startsWith("|")) {
        return line
      }

      return line
        .replace(/(\|)\s+(?=\|\s*:?-{3,}:?)/g, "$1\n")
        .replace(/(\|)\s+(?=\|\s*[\u4e00-\u9fffA-Za-z0-9（(])/g, "$1\n")
    })
    .join("\n")
}

function splitTrailingTextAfterTableRow(line: string) {
  if (!line.trimStart().startsWith("|")) {
    return line
  }
  const lastPipe = line.lastIndexOf("|")
  if (lastPipe < 0 || lastPipe === line.length - 1) {
    return line
  }
  const trailing = line.slice(lastPipe + 1).trim()
  if (!trailing) {
    return line
  }
  return `${line.slice(0, lastPipe + 1)}\n${trailing}`
}
