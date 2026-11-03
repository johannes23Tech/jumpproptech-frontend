export default function BarChart({ data }: { data: { month: string, income: number, expense: number }[] }) {
  // Find the highest value to scale the chart properly
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-premium hover:shadow-premium-hover transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display text-xl font-bold text-black">Financial Trend</h3>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gold"></div> Income</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-danger"></div> Expenses</div>
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-2 md:gap-6 pt-4 border-b border-gray-200">
        {data.map((item, index) => {
          const incomeHeight = (item.income / maxValue) * 100;
          const expenseHeight = (item.expense / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-black text-white text-xs p-2 rounded-lg pointer-events-none z-10 whitespace-nowrap shadow-xl">
                Inc: R{item.income} <br/> Exp: R{item.expense}
              </div>

              {/* Bars */}
              <div className="w-full flex justify-center gap-1 h-full items-end">
                {/* Income Bar */}
                <div 
                  className="w-1/2 max-w-[30px] bg-gold rounded-t-md transition-all duration-700 ease-out hover:opacity-80"
                  style={{ height: `${Math.max(incomeHeight, 2)}%` }} // 2% min height so it's visible if 0
                ></div>
                {/* Expense Bar */}
                <div 
                  className="w-1/2 max-w-[30px] bg-danger rounded-t-md transition-all duration-700 ease-out hover:opacity-80"
                  style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                ></div>
              </div>
              
              {/* Month Label */}
              <span className="text-xs font-bold text-gray-400 mt-2">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}