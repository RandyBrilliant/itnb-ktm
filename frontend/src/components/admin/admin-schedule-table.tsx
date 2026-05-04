type AdminScheduleItem = {
  time: string
  session: string
  module: string
  batch: string
  venue: string
  status: "COMPLETED" | "IN PROGRESS" | "SCHEDULED"
}

type AdminScheduleTableProps = {
  items: AdminScheduleItem[]
}

export function AdminScheduleTable({ items }: AdminScheduleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-[#f3f3f3]">
            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">Time</th>
            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">Module</th>
            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">Venue</th>
            <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f5e5e]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ececec]">
          {items.map((item) => (
            <tr key={`${item.time}-${item.module}`} className="transition-colors hover:bg-[#f8f8f8]">
              <td className="px-8 py-6">
                <p className={`text-sm font-bold ${item.status === "IN PROGRESS" ? "text-[#af0f24]" : "text-[#1a1c1c]"}`}>
                  {item.time}
                </p>
                <p className="text-[10px] text-[#5f5e5e]">{item.session}</p>
              </td>
              <td className="px-8 py-6">
                <p className="text-sm font-extrabold text-[#1a1c1c]">{item.module}</p>
                <p className="text-xs italic text-[#5f5e5e]">{item.batch}</p>
              </td>
              <td className="px-8 py-6">
                <p className="flex items-center gap-2 text-sm font-medium text-[#1a1c1c]">
                  <span className="material-symbols-outlined text-sm text-[#af0f24]">location_on</span>
                  {item.venue}
                </p>
              </td>
              <td className="px-8 py-6">
                {item.status === "IN PROGRESS" ? (
                  <span className="flex items-center gap-2 text-[10px] font-bold text-[#af0f24]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#af0f24]" />
                    IN PROGRESS
                  </span>
                ) : (
                  <span
                    className={`rounded-sm px-2 py-1 text-[10px] font-bold ${
                      item.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-[#ececec] text-[#5f5e5e]"
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type { AdminScheduleItem }
