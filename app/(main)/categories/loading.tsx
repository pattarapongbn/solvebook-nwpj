function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

export default function CategoriesLoading() {
  return (
    <div>
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-sm border-b border-brown-100">
        <div className="section-wrap py-3">
          <Bone className="h-10 w-full rounded-2xl" />
        </div>
      </div>

      <div className="section-wrap py-8">
        <div className="mb-6 space-y-2">
          <Bone className="h-8 w-32" />
          <Bone className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border border-brown-100 bg-white">
              <Bone className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
