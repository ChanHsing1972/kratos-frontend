import { useEffect, useMemo, useState } from "react"
import { Database, FileUp, Power, RefreshCw, Search } from "lucide-react"

import {
  createKnowledgeTextDocument,
  createKnowledgeUrlDocument,
  listKnowledgeDocuments,
  searchKnowledgeBase,
  updateKnowledgeDocumentActive,
  uploadKnowledgeDocument,
} from "@/entities/kratos/api/client"
import type { KnowledgeDocument, KnowledgeSearchHit } from "@/entities/kratos/model/types"
import { AUTH_TOKEN_KEY } from "@/entities/kratos/api/client"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/utils"

type KnowledgeBasePageProps = {
  onLogin: () => void
}

export function KnowledgeBasePage({ onLogin }: KnowledgeBasePageProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [hits, setHits] = useState<KnowledgeSearchHit[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [query, setQuery] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const token = useMemo(() => localStorage.getItem(AUTH_TOKEN_KEY) ?? "", [])

  const refresh = async () => {
    if (!token) return
    setLoading(true)
    setMessage("")
    try {
      setDocuments(await listKnowledgeDocuments(token))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "知识库加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleCreateText = async () => {
    if (!token) {
      onLogin()
      return
    }
    if (!title.trim() || !content.trim()) {
      setMessage("请填写标题和内容")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      await createKnowledgeTextDocument(token, {
        title: title.trim(),
        content: content.trim(),
      })
      setTitle("")
      setContent("")
      await refresh()
      setMessage("文本知识已入库并完成分块向量化")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文本入库失败")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    if (!token) {
      onLogin()
      return
    }
    setLoading(true)
    setMessage("")
    try {
      await uploadKnowledgeDocument(token, file)
      await refresh()
      setMessage("文档已解析、分块并写入向量库")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文档上传失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUrl = async () => {
    if (!token) {
      onLogin()
      return
    }
    if (!url.trim()) {
      setMessage("请输入网页 URL")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      await createKnowledgeUrlDocument(token, {
        url: url.trim(),
        title: title.trim() || undefined,
      })
      setUrl("")
      await refresh()
      setMessage("网页内容已抓取、分块并写入向量库")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "网页导入失败")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!token) {
      onLogin()
      return
    }
    if (!query.trim()) {
      setMessage("请输入检索问题")
      return
    }
    setLoading(true)
    setMessage("")
    try {
      const result = await searchKnowledgeBase(token, query.trim())
      setHits(result.hits)
      setMessage(`命中 ${result.count} 个 chunk`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "检索失败")
    } finally {
      setLoading(false)
    }
  }

  const toggleDocument = async (document: KnowledgeDocument) => {
    if (!token) {
      onLogin()
      return
    }
    setLoading(true)
    setMessage("")
    try {
      await updateKnowledgeDocumentActive(token, document.id, !document.is_active)
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "状态更新失败")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-full items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <Database className="mx-auto size-9 text-primary" />
          <h1 className="mt-4 text-xl font-bold">知识库</h1>
          <p className="mt-2 text-sm text-muted-foreground">登录后管理 RAG 文档、chunk 和检索测试。</p>
          <Button className="mt-5" onClick={onLogin} type="button">登录</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-background px-5 py-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">知识库</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {documents.length} 个文档 · {documents.reduce((sum, item) => sum + item.chunk_count, 0)} 个 chunk
            </p>
          </div>
          <Button onClick={refresh} type="button" variant="outline">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            刷新
          </Button>
        </header>

        {message ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-bold">导入知识</h2>
            <div className="mt-4 space-y-3">
              <Input
                onChange={(event) => setTitle(event.target.value)}
                placeholder="标题"
                value={title}
              />
              <Textarea
                className="min-h-44"
                onChange={(event) => setContent(event.target.value)}
                placeholder="粘贴 Markdown、TXT 或网页正文"
                value={content}
              />
              <Input
                onChange={(event) => setUrl(event.target.value)}
                placeholder="网页 URL，可选"
                value={url}
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={loading} onClick={handleCreateText} type="button">
                  <Database className="size-4" />
                  入库
                </Button>
                <Button disabled={loading} onClick={handleCreateUrl} type="button" variant="outline">
                  <Search className="size-4" />
                  导入 URL
                </Button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent">
                  <FileUp className="size-4" />
                  上传 PDF/TXT/MD
                  <input
                    accept=".pdf,.txt,.md,.markdown"
                    className="sr-only"
                    onChange={(event) => void handleUpload(event.target.files?.[0])}
                    type="file"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h2 className="text-base font-bold">检索测试</h2>
              <div className="mt-3 flex gap-2">
                <Input
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleSearch()
                  }}
                  placeholder="例如：膝盖疼还能深蹲吗？"
                  value={query}
                />
                <Button disabled={loading} onClick={handleSearch} type="button">
                  <Search className="size-4" />
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-base font-bold">文档</h2>
              </div>
              <div className="divide-y">
                {documents.length ? documents.map((document) => (
                  <article className="flex items-start justify-between gap-4 px-4 py-3" key={document.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold">{document.title}</h3>
                        <Badge variant={document.is_active ? "default" : "secondary"}>
                          {document.is_active ? "启用" : "停用"}
                        </Badge>
                        <Badge variant="outline">{document.source_type}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {document.chunk_count} chunks · {document.status} · {new Date(document.updated_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <Button
                      className="shrink-0"
                      onClick={() => void toggleDocument(document)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Power className="size-4" />
                      {document.is_active ? "停用" : "启用"}
                    </Button>
                  </article>
                )) : (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    还没有知识文档
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-base font-bold">命中片段</h2>
              </div>
              <div className="divide-y">
                {hits.length ? hits.map((hit) => (
                  <article className="px-4 py-3" key={hit.chunk_id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{hit.citation}</Badge>
                      {typeof hit.score === "number" ? (
                        <span className="text-xs text-muted-foreground">score {hit.score.toFixed(3)}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-4 text-sm leading-6">{hit.content}</p>
                  </article>
                )) : (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    输入问题后查看向量检索命中的 chunk
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
