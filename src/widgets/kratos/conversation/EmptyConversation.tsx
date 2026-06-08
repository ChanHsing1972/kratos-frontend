import type { ReactNode } from "react"

type EmptyConversationProps = {
  composer: ReactNode
}

export function EmptyConversation({ composer }: EmptyConversationProps) {
  return (
    <section className="mx-auto flex w-full flex-col justify-center px-0">
      <div className="mb-12 text-center">
        <h3 className="text-xl font-normal tracking-tight text-foreground sm:text-3xl">
          您今天想完成什么？
        </h3>
        {/* <p className="mx-auto mt-3 max-w-xl text-md leading-6 text-muted-foreground">
          Kratos 会根据您的训练目标、身体状况和恢复情况，提供个性化的训练计划。
        </p> */}
      </div>
      {composer}
    </section>
  )
}
