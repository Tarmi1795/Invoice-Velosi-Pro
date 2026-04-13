export function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  const s = status?.toLowerCase() || '';
  if (s === 'paid' || s === 'approved' || s === 'ok') {
    color = "bg-green-500/20 text-green-500 border-green-500/30";
  } else if (s === 'sent' || s === 'pending' || s === 'received' || s === 'warning' || s === 'with term') {
    color = "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
  } else if (s === 'overdue' || s === 'cancelled' || s === 'low balance' || s === 'over budget' || s === 'returned for revision') {
    color = "bg-red-500/20 text-red-500 border-red-500/30";
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      {status || 'Unknown'}
    </span>
  );
}
