"use client";

import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/DataTable";

export function HighlightableDataTable(props: Omit<Parameters<typeof DataTable>[0], "highlightedId">) {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get("highlight") ?? undefined;
  return <DataTable {...props} highlightedId={highlightedId} />;
}
