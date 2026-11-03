export default function Skeleton({ type = 'card' }: { type?: 'card' | 'row' | 'chart' }) {
  if (type === 'row') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 mb-3">
        <div className="w-12 h-12 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-1/3 h-4 skeleton" />
          <div className="w-1/2 h-3 skeleton" />
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 h-64 flex flex-col justify-end gap-2 p-6">
        <div className="flex items-end gap-2 h-full">
           <div className="w-full h-[40%] skeleton" />
           <div className="w-full h-[70%] skeleton" />
           <div className="w-full h-[50%] skeleton" />
           <div className="w-full h-[90%] skeleton" />
           <div className="w-full h-[60%] skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-1/4 h-3 skeleton mb-3" />
      <div className="w-1/2 h-8 skeleton" />
    </div>
  );
}