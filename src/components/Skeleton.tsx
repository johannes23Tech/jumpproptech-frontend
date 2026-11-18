export default function Skeleton({ type = 'card' }: { type?: 'card' | 'row' | 'chart' }) {
  if (type === 'row') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse pointer-events-none" />
        <div className="w-12 h-12 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-4 skeleton rounded" />
          <div className="w-1/2 h-3 skeleton rounded" />
        </div>
        <div className="w-16 h-6 skeleton rounded-full hidden sm:block" />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 h-64 flex flex-col justify-end gap-2 overflow-hidden relative">
        <div className="absolute inset-x-6 top-5 flex items-center justify-between">
          <div className="w-32 h-4 skeleton rounded" />
          <div className="w-20 h-3 skeleton rounded" />
        </div>
        <div className="flex items-end gap-2 h-full pt-8">
           <div className="w-full h-[40%] skeleton rounded-t-lg" />
           <div className="w-full h-[70%] skeleton rounded-t-lg" />
           <div className="w-full h-[50%] skeleton rounded-t-lg" />
           <div className="w-full h-[90%] skeleton rounded-t-lg" />
           <div className="w-full h-[60%] skeleton rounded-t-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-100 via-gold/20 to-gray-100" />
      <div className="w-1/3 h-3 skeleton mb-3 rounded" />
      <div className="w-1/2 h-8 skeleton mb-2 rounded" />
      <div className="w-2/3 h-3 skeleton rounded" />
    </div>
  );
}