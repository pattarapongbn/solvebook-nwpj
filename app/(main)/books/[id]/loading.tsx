function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

export default function BookLoading() {
  return (
    <div className="pb-48 md:pb-0">
      {/* Top bar */}
      <div className="section-wrap py-4 flex items-center justify-between">
        <Bone className="h-9 w-9 rounded-xl" />
        <div className="flex gap-1">
          <Bone className="h-9 w-9 rounded-xl" />
          <Bone className="h-9 w-9 rounded-xl" />
        </div>
      </div>

      <div className="section-wrap pb-8 md:py-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-10">
          {/* Cover */}
          <div className="flex-shrink-0 w-44 md:w-52 mx-auto md:mx-0">
            <Bone className="w-full aspect-[2/3] rounded-2xl" />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <Bone className="h-4 w-24" />
            <Bone className="h-8 w-3/4" />
            <Bone className="h-4 w-32" />

            {/* Stats */}
            <div className="flex gap-4">
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
              <Bone className="h-4 w-24" />
            </div>

            {/* Description */}
            <div className="space-y-2 max-w-xl">
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-2/3" />
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Bone className="h-11 w-36 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Related books */}
        <div>
          <Bone className="h-6 w-40 mb-5" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-32 flex-shrink-0 space-y-2">
                <Bone className="w-full aspect-[2/3] rounded-2xl" />
                <Bone className="h-3.5 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
