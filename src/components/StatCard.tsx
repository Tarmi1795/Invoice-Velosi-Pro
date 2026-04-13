export function StatCard({ title, value, icon: Icon, colorClass }: { title: string; value: string | number; icon: any; colorClass: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.split(' ')[0].replace('text-', 'stroke-')} size={28} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="text-2xl font-semibold text-white mt-1">{value}</p>
      </div>
    </div>
  );
}
