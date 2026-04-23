export function UserAvatar() {
  return (
    <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#e6e2dc]">
      <div className="absolute top-2 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[#a36b43]" />
      <div className="absolute top-1.5 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-t-full bg-[#211915]" />
      <div className="absolute right-2 bottom-0 left-2 h-6 rounded-t-[16px] bg-[#101010]" />
      <div className="absolute bottom-3 left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-b-full bg-[#d9d9d9]" />
    </div>
  )
}
