function Bone({ className }: { className?: string }) {
  return <div className={`bg-brown-100 animate-pulse rounded-xl ${className ?? ''}`} />
}

export default function ProfileLoading() {
  return (
    <div className="section-wrap py-6 max-w-lg">
      {/* Back */}
      <Bone className="h-9 w-9 rounded-xl mb-6" />

      {/* Avatar & name */}
      <div className="flex flex-col items-center text-center mb-8 gap-3">
        <Bone className="w-20 h-20 rounded-full" />
        <Bone className="h-7 w-36" />
        <Bone className="h-4 w-48" />
      </div>

      {/* Stat card */}
      <div className="flex justify-center mb-8">
        <Bone className="h-28 w-36 rounded-2xl" />
      </div>

      {/* Menu items */}
      <div className="border border-brown-100 rounded-3xl overflow-hidden divide-y divide-brown-100 bg-white">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Bone className="w-5 h-5 rounded" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
