function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

function BookGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Bone className="w-full aspect-[2/3] rounded-2xl" />
          <Bone className="h-3.5 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export default function LibraryLoading() {
  return (
    <div className="section-wrap py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bone className="h-9 w-9 rounded-xl" />
        <Bone className="h-8 w-48" />
      </div>

      {/* อ่านล่าสุด */}
      <section className="mb-10">
        <Bone className="h-6 w-24 mb-4" />
        <BookGrid />
      </section>

      {/* ถูกใจ */}
      <section className="mb-10">
        <Bone className="h-6 w-16 mb-4" />
        <BookGrid />
      </section>

      {/* ซื้อแล้ว */}
      <section className="mb-10">
        <Bone className="h-6 w-20 mb-4" />
        <BookGrid />
      </section>
    </div>
  )
}
