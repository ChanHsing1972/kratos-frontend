import { Streamdown, type Components } from "streamdown"

import { cn } from "@/shared/lib/utils"

type MarkdownMessageProps = {
  className?: string
  children: string
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
    <div className="my-4 w-full max-w-full overflow-x-auto rounded-[8px] border border-border">
      <table
        className={cn(
          "w-full min-w-[42rem] table-fixed border-separate border-spacing-0 text-left text-[14px] leading-6",
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
        "max-w-[28rem] border-t border-border px-3.5 py-2.5 align-top break-words",
        className
      )}
      {...markdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "bg-muted/80 px-3.5 py-2.5 align-top font-semibold break-words text-foreground",
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
  className,
  streaming = false,
}: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "markdown-message min-w-0 text-[15.5px] leading-[1.78] break-words text-foreground [overflow-wrap:anywhere] [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_strong]:font-semibold",
        className
      )}
    >
      <Streamdown
        components={components}
        controls={false}
        isAnimating={streaming}
        mode={streaming ? "streaming" : "static"}
        parseIncompleteMarkdown={streaming}
        skipHtml
      >
        {streaming
          ? stabilizeStreamingMarkdown(children)
          : normalizeMarkdownInput(children)}
      </Streamdown>
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

  return stabilizeInlineMarkdown(stabilizeTrailingIncompleteTableRow(normalized))
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

function stabilizeTrailingIncompleteTableRow(markdown: string) {
  const lines = markdown.split("\n")
  let lastIndex = lines.length - 1

  while (lastIndex >= 0 && lines[lastIndex].trim() === "") {
    lastIndex -= 1
  }

  if (lastIndex < 2) {
    return markdown
  }

  const lastLine = lines[lastIndex].trim()
  if (!lastLine.includes("|") || lastLine.endsWith("|")) {
    return markdown
  }

  if (!hasTableSeparatorBefore(lines, lastIndex)) {
    return markdown
  }

  return lines.slice(0, lastIndex).join("\n")
}

function hasTableSeparatorBefore(lines: string[], rowIndex: number) {
  for (let index = rowIndex - 1; index >= 1; index -= 1) {
    const line = lines[index].trim()
    if (!line) {
      return false
    }
    if (isTableSeparatorLine(line)) {
      return lines[index - 1]?.includes("|") ?? false
    }
    if (!line.includes("|")) {
      return false
    }
  }
  return false
}

function isTableSeparatorLine(line: string) {
  const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|")
  return cells.length >= 2 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()))
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
