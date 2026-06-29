function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

export default function HomeLoading() {
  return (
    <div className="section-wrap">
      {/* Greeting */}
      <div className="md:hidden pt-5 pb-3 flex items-center justify-between">
        <div className="space-y-1.5">
          <Bone className="h-3 w-12" />
          <Bone className="h-6 w-28" />
        </div>
        <div className="flex gap-1">
          <Bone className="h-9 w-9 rounded-full" />
          <Bone className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Search bar */}
      <div className="md:hidden pb-4">
        <Bone className="h-10 w-full rounded-2xl" />
      </div>

      {/* Popular carousel */}
      <section className="section-gap">
        <div className="flex items-baseline justify-between mb-5">
          <Bone className="h-6 w-32" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Bone key={i} className="h-52 w-36 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="section-gap border-t border-brown-100">
        <div className="flex items-baseline justify-between mb-5">
          <Bone className="h-6 w-24" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <Bone className="w-14 h-14 rounded-2xl" />
              <Bone className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured grid */}
      <section className="section-gap border-t border-brown-100">
        <div className="flex items-baseline justify-between mb-5">
          <Bone className="h-6 w-36" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="w-full aspect-[2/3] rounded-2xl" />
              <Bone className="h-3.5 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
