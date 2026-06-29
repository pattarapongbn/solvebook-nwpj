function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

export default function WalletLoading() {
  return (
    <div className="section-wrap py-6 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Bone className="h-9 w-9 rounded-xl" />
        <Bone className="h-7 w-36" />
      </div>

      {/* Balance card */}
      <Bone className="h-48 w-full rounded-3xl mb-6" />

      {/* Requests */}
      <section className="mb-8">
        <Bone className="h-6 w-40 mb-3" />
        <div className="border border-brown-100 rounded-2xl overflow-hidden divide-y divide-brown-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white">
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-32" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Transactions */}
      <section>
        <Bone className="h-6 w-36 mb-3" />
        <div className="border border-brown-100 rounded-2xl overflow-hidden divide-y divide-brown-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white">
              <Bone className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-20" />
              </div>
              <Bone className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
