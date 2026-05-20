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
        "font-medium text-foreground underline decoration-foreground/30 underline-offset-3 transition-colors hover:decoration-foreground",
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
        "border-l-2 border-border pl-3 text-muted-foreground",
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
      className={cn("text-[18px] leading-6 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("text-[16px] leading-6 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("text-[14px] leading-5 font-bold", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr
      className={cn("border-border", className)}
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
      className={cn("list-decimal space-y-1 pl-5", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("leading-[1.7]", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "overflow-x-auto rounded-[10px] bg-muted px-3 py-2 text-[12px] leading-5",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left text-[12px] leading-5",
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
      className={cn("border border-border px-2.5 py-1.5", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border border-border px-2.5 py-1.5 font-semibold",
        className
      )}
      {...cleanMarkdownProps(props)}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("list-disc space-y-1 pl-5", className)}
      {...cleanMarkdownProps(props)}
    />
  ),
}

export function MarkdownMessage({ children, className }: MarkdownMessageProps) {
  return (
    <div
      className={cn(
        "markdown-message min-w-0 space-y-2 text-[14px] leading-[1.7] break-words",
        className
      )}
    >
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
