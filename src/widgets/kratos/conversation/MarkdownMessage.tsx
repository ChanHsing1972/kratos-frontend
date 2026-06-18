import { Streamdown, type Components } from "streamdown"
import { BookOpenText, ExternalLink } from "lucide-react"

import type { RagCitation } from "@/entities/kratos/model/types"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/ui/hover-card"

type MarkdownMessageProps = {
  className?: string
  children: string
  citations?: RagCitation[]
  streaming?: boolean
}

function markdownProps<T extends { node?: unknown }>(
  props: T
): Omit<T, "node"> {
  const next = { ...props }
  delete next.node
  return next
}

const components: Components = {
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "font-medium break-words text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary",
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
        "my-4 border-l-4 border-border bg-muted/35 py-1.5 pr-4 pl-4 text-[15px] leading-7 text-muted-foreground [&_p]:my-1.5",
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
      className={cn("mt-4 mb-1.5 text-[15.5px] leading-6 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn("mt-4 mb-1.5 text-[15px] leading-6 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn("mt-4 mb-1.5 text-[14px] leading-6 font-semibold", className)}
      {...markdownProps(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 border-border", className)} {...markdownProps(props)} />
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
        "my-4 max-w-full overflow-x-auto rounded-[8px] border border-border bg-muted/80 p-4 text-[13px] leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] [tab-size:2] [&_code]:block [&_code]:overflow-visible [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[13px] [&_code]:leading-6 [&_code]:whitespace-pre",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="markdown-table-scroll my-4 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-[8px] border border-border bg-card">
      <table
        className={cn(
          "w-full min-w-[46rem] table-auto border-separate border-spacing-0 text-left text-[14px] leading-6",
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
        "min-w-[8.5rem] max-w-[24rem] border-t border-border px-3.5 py-2.5 align-top break-words",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "min-w-[8.5rem] bg-muted/80 px-3.5 py-2.5 align-top font-semibold break-words text-foreground",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("[&_tr]:border-b", className)} {...markdownProps(props)} />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("even:bg-muted/25", className)} {...markdownProps(props)} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-3 list-disc space-y-1.5 pl-6", className)}
      {...markdownProps(props)}
    />
  ),
}

export function MarkdownMessage({
  children,
  citations = [],
  className,
  streaming = false,
}: MarkdownMessageProps) {
  const prepared = prepareCitationLinks(normalizeMarkdownInput(children), citations)
  const normalized = prepared.markdown
  const messageComponents = citationAwareComponents(prepared.citations)
  const streamingTable = streaming
    ? splitStreamingTable(normalized)
    : null

  return (
    <div
      className={cn(
        "markdown-message min-w-0 text-[15.5px] leading-[1.78] break-words text-foreground [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_strong]:font-semibold",
        className
      )}
    >
      {streamingTable ? (
        <>
          {streamingTable.before ? (
            <Streamdown
              components={messageComponents}
              controls={false}
              isAnimating
              mode="streaming"
              parseIncompleteMarkdown
              skipHtml
            >
              {stabilizeStreamingMarkdown(streamingTable.before)}
            </Streamdown>
          ) : null}
          <StreamingMarkdownTable lines={streamingTable.tableLines} />
          {streamingTable.after ? (
            <Streamdown
              components={messageComponents}
              controls={false}
              isAnimating
              mode="streaming"
              parseIncompleteMarkdown
              skipHtml
            >
              {stabilizeStreamingMarkdown(streamingTable.after)}
            </Streamdown>
          ) : null}
        </>
      ) : (
        <Streamdown
          components={messageComponents}
          controls={false}
          isAnimating={streaming}
          mode={streaming ? "streaming" : "static"}
          parseIncompleteMarkdown={streaming}
          skipHtml
        >
          {streaming ? stabilizeStreamingMarkdown(normalized) : normalized}
        </Streamdown>
      )}
    </div>
  )
}

function citationAwareComponents(citations: RagCitation[]): Components {
  return {
    ...components,
    a: ({ className, href, ...props }) => {
      const citationIndex = citationIndexFromHref(href)
      const citation = citationIndex === null ? undefined : citations[citationIndex]
      if (citation) {
        return <CitationBadge citation={citation} />
      }
      return (
        <a
          className={cn(
            "font-medium break-words text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary",
            className
          )}
          href={href}
          rel="noreferrer"
          target="_blank"
          {...markdownProps(props)}
        />
      )
    },
  }
}

function CitationBadge({ citation }: { citation: RagCitation }) {
  const label = citationBadgeLabel(citation)
  return (
    <HoverCard closeDelay={100} openDelay={150}>
      <HoverCardTrigger asChild>
        <Badge className="cursor-default align-middle" variant="secondary">
          <BookOpenText data-icon="inline-start" />
          <span className="truncate">{label}</span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-96">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{citation.document_title}</p>
            {citation.source_title && citation.source_title !== citation.document_title ? (
              <p className="text-xs text-muted-foreground">{citation.source_title}</p>
            ) : null}
          </div>
          <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {citation.content}
          </p>
          {citation.source_url ? (
            <a
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              href={citation.source_url}
              rel="noreferrer"
              target="_blank"
            >
              查看来源
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function prepareCitationLinks(markdown: string, citations: RagCitation[]) {
  const resolved = [...citations]
  let linked = markdown.replace(
    /\[([^\]\n]+?)\s+#chunk-(\d+)\](?!\()/gi,
    (marker, title: string, chunkIdText: string) => {
      const chunkId = Number.parseInt(chunkIdText, 10)
      const index = findCitationIndex(resolved, {
        chunkId,
        marker,
        title,
      })

      if (index < 0) {
        return marker
      }

      const label = stripCitationLabelBrackets(citationBadgeLabel(resolved[index]))
      return `[${label}](#rag-citation-${index})`
    }
  )

  linked = linked.replace(
    /\[知识库:([^\]#\n]+)#(\d+)\](?!\()/g,
    (marker, title: string, chunkIdText: string) => {
      const index = findCitationIndex(resolved, {
        marker,
        title,
        legacyIndex: Number.parseInt(chunkIdText, 10),
      })
      if (index < 0) {
        return marker
      }
      return `[${citationBadgeLabel(resolved[index])}](#rag-citation-${index})`
    }
  )

  linked = citations.reduce((text, citation, index) => {
    if (
      !citation.citation ||
      /#chunk-\d+/i.test(citation.citation) ||
      !text.includes(citation.citation)
    ) {
      return text
    }
    const label = stripCitationLabelBrackets(citationBadgeLabel(citation))
    return text.split(citation.citation).join(`[${label}](#rag-citation-${index})`)
  }, linked)

  return { citations: resolved, markdown: linked }
}

function findCitationIndex(
  citations: RagCitation[],
  target: { chunkId?: number | null; legacyIndex?: number | null; marker: string; title?: string }
) {
  const normalizedMarker = normalizeCitationMarker(target.marker)
  const normalizedTitle = normalizeCitationMarker(target.title ?? "")
  return citations.findIndex((citation) => {
    if (target.chunkId && citation.chunk_id === target.chunkId) {
      return true
    }
    if (normalizeCitationMarker(citation.citation) === normalizedMarker) {
      return true
    }
    if (!normalizedTitle) {
      return false
    }
    const titleCandidates = [
      citation.document_title,
      citation.source_title,
      citation.citation,
    ].map((value) => normalizeCitationMarker(value ?? ""))
    return titleCandidates.some((value) => value === normalizedTitle || value.includes(normalizedTitle))
  })
}

function normalizeCitationMarker(value: string) {
  return value.replace(/\s+/g, "").toLowerCase()
}

function stripCitationLabelBrackets(value: string) {
  return value.replaceAll("[", "").replaceAll("]", "")
}

function citationIndexFromHref(href?: string) {
  const match = /^#rag-citation-(\d+)$/.exec(href ?? "")
  return match ? Number.parseInt(match[1], 10) : null
}

function citationBadgeLabel(citation: RagCitation) {
  if (citation.source_url) {
    try {
      return new URL(citation.source_url).hostname.replace(/^www\./, "")
    } catch {
      // Fall back to the stored source title.
    }
  }
  return citation.source_title || citation.document_title
}

function StreamingMarkdownTable({ lines }: { lines: string[] }) {
  const { headers, rows, columnCount } = parseStreamingTableLines(lines)
  if (!headers.length) {
    return null
  }

  return (
    <div className="markdown-table-scroll my-4 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-[8px] border border-border bg-card">
      <table className="w-full min-w-[46rem] table-auto border-separate border-spacing-0 text-left text-[14px] leading-6">
        <thead className="[&_tr]:border-b">
          <tr className="even:bg-muted/25">
            {padTableCells(headers, columnCount).map((cell, index) => (
              <th
                className="min-w-[8.5rem] bg-muted/80 px-3.5 py-2.5 align-top font-semibold break-words text-foreground"
                key={`header-${index}`}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="even:bg-muted/25" key={`row-${rowIndex}`}>
              {padTableCells(row, columnCount).map((cell, cellIndex) => (
                <td
                  className="min-w-[8.5rem] max-w-[24rem] border-t border-border px-3.5 py-2.5 align-top break-words"
                  key={`row-${rowIndex}-cell-${cellIndex}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function normalizeMarkdownInput(markdown: string) {
  return markdown.replace(/\r\n?/g, "\n")
}

function stabilizeStreamingMarkdown(markdown: string) {
  const normalized = normalizeMarkdownInput(markdown)
  const openFence = findOpenCodeFence(normalized)
  if (openFence) {
    return `${normalized}\n${openFence}`
  }

  return stabilizeInlineMarkdown(stabilizeStreamingTableTail(normalized))
}

function splitStreamingTable(markdown: string) {
  const lines = markdown.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ""
    if (!looksLikeStreamingTableStart(line, lines[index + 1]?.trim() ?? "")) {
      continue
    }
    const endIndex = findStreamingTableEnd(lines, index)
    return {
      before: lines.slice(0, index).join("\n").trimEnd(),
      tableLines: lines.slice(index, endIndex),
      after: lines.slice(endIndex).join("\n").trimStart(),
    }
  }
  return null
}

function findStreamingTableEnd(lines: string[], startIndex: number) {
  let index = startIndex
  for (; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ""
    if (!line) {
      continue
    }
    if (!line.includes("|") && index > startIndex) {
      break
    }
  }
  return index
}

function parseStreamingTableLines(lines: string[]) {
  const rows = lines
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => splitTableLine(line))

  const headerIndex = rows.findIndex((row) => row.length >= 2)
  const headers = headerIndex >= 0 ? rows[headerIndex] : []
  const bodyRows = rows
    .slice(headerIndex + 1)
    .filter((row) => !row.every(isTableSeparatorCell))
    .filter((row) => row.some((cell) => cell.trim()))
  const columnCount = Math.max(
    headers.length,
    ...bodyRows.map((row) => row.length),
    1
  )

  return { headers, rows: bodyRows, columnCount }
}

function looksLikeStreamingTableStart(line: string, nextLine: string) {
  if (!line.includes("|")) {
    return false
  }
  if (isTableSeparatorLine(nextLine) || isTableSeparatorFragment(nextLine)) {
    return true
  }
  return line.startsWith("|") && splitTableLine(line).length >= 2
}

function findOpenCodeFence(markdown: string) {
  let openFence: string | null = null

  for (const line of markdown.split("\n")) {
    const match = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (!match) {
      continue
    }

    const fence = match[1]
    if (!openFence) {
      openFence = fence
      continue
    }

    if (fence[0] === openFence[0] && fence.length >= openFence.length) {
      openFence = null
    }
  }

  return openFence
}

function stabilizeStreamingTableTail(markdown: string) {
  const lines = markdown.split("\n")
  let lastIndex = lines.length - 1

  while (lastIndex >= 0 && lines[lastIndex].trim() === "") {
    lastIndex -= 1
  }

  if (lastIndex < 2) {
    return markdown
  }

  const lastLine = lines[lastIndex]
  const trimmedLastLine = lastLine.trim()
  if (!trimmedLastLine.includes("|")) {
    return markdown
  }

  if (isTableSeparatorFragment(trimmedLastLine)) {
    const headerIndex = findPreviousNonEmptyLine(lines, lastIndex - 1)
    if (headerIndex !== null && lines[headerIndex]?.includes("|")) {
      const headerColumnCount = splitTableLine(lines[headerIndex]).length
      const separatorCells = splitTableLine(trimmedLastLine)
      if (
        trimmedLastLine.endsWith("|") &&
        separatorCells.length >= headerColumnCount &&
        separatorCells.every(isTableSeparatorCell)
      ) {
        return markdown
      }
      return lines.slice(0, headerIndex).join("\n")
    }
    return lines.slice(0, lastIndex).join("\n")
  }

  const columnCount = findTableColumnCountBefore(lines, lastIndex)
  if (!columnCount) {
    if (looksLikeTableTail(trimmedLastLine)) {
      return lines.slice(0, lastIndex).join("\n")
    }
    return markdown
  }

  const cells = splitTableLine(trimmedLastLine)
  if (trimmedLastLine.endsWith("|") && cells.length >= columnCount) {
    return markdown
  }

  return lines.slice(0, lastIndex).join("\n")
}

function findTableColumnCountBefore(lines: string[], rowIndex: number) {
  for (let index = rowIndex - 1; index >= 1; index -= 1) {
    const line = lines[index].trim()
    if (!line) {
      return null
    }
    if (isTableSeparatorLine(line)) {
      return splitTableLine(line).length
    }
    if (!line.includes("|")) {
      return null
    }
  }
  return null
}

function isTableSeparatorLine(line: string) {
  const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|")
  return cells.length >= 2 && cells.every(isTableSeparatorCell)
}

function isTableSeparatorCell(cell: string) {
  return /^:?-{2,}:?$/.test(cell.trim())
}

function isTableSeparatorFragment(line: string) {
  const content = line.replace(/[|\-:\s]/g, "")
  return line.includes("-") && content.length === 0
}

function findPreviousNonEmptyLine(lines: string[], startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (lines[index]?.trim()) {
      return index
    }
  }
  return null
}

function looksLikeTableTail(line: string) {
  if (line.startsWith("|")) {
    return line.split("|").length >= 3
  }
  return /^[^|\n]{1,40}\|/.test(line)
}

function splitTableLine(line: string) {
  return line
    .replace(/^\s*\|?/, "")
    .replace(/\|?\s*$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function padTableCells(cells: string[], columnCount: number) {
  const next = [...cells]
  while (next.length < columnCount) {
    next.push("")
  }
  return next
}

function stabilizeInlineMarkdown(markdown: string) {
  let next = markdown
  if (hasUnclosedInlineCode(next)) {
    next += "`"
  }
  if (hasOddUnescapedMarker(next, "**")) {
    next += "**"
  }
  if (hasOddUnescapedMarker(next, "__")) {
    next += "__"
  }
  return next
}

function hasUnclosedInlineCode(markdown: string) {
  const withoutFences = markdown.replace(/^ {0,3}(`{3,}|~{3,}).*$/gm, "")
  return countStandaloneBackticks(withoutFences) % 2 === 1
}

function hasOddUnescapedMarker(markdown: string, marker: string) {
  return countUnescapedMarker(markdown, marker) % 2 === 1
}

function countStandaloneBackticks(markdown: string) {
  let count = 0
  for (let index = 0; index < markdown.length; index += 1) {
    if (markdown[index] !== "`") {
      continue
    }
    if (markdown[index - 1] === "`" || markdown[index + 1] === "`") {
      continue
    }
    count += 1
  }
  return count
}

function countUnescapedMarker(markdown: string, marker: string) {
  let count = 0
  let index = 0
  while (index < markdown.length) {
    const found = markdown.indexOf(marker, index)
    if (found < 0) {
      break
    }
    if (!isEscaped(markdown, found)) {
      count += 1
    }
    index = found + marker.length
  }
  return count
}

function isEscaped(text: string, index: number) {
  let slashCount = 0
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}
