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
        "max-w-[28rem] border-t border-border px-3.5 py-2.5 align-top break-words",
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
  return openFence ? `${normalized}\n${openFence}` : normalized
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
