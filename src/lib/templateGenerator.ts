import * as XLSX from "xlsx";

export function generateTemplate(
  expectedHeaders: string[],
  filename: string = "template.xlsx"
): Blob {
  const wsData = [expectedHeaders];
  
  const hintRow = expectedHeaders.map(() => "example value");
  wsData.push(hintRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws["!cols"] = expectedHeaders.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadTemplate(expectedHeaders: string[], filename: string = "template.xlsx") {
  const blob = generateTemplate(expectedHeaders, filename);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string = "export.xlsx",
  sheetName: string = "Data"
): Blob {
  if (data.length === 0) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["No data available"]]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  const headers = Object.keys(data[0]);
  const wsData = [headers];
  
  data.forEach(row => {
    wsData.push(headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (val instanceof Date) return val.toLocaleDateString();
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    }));
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = headers.map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function downloadExcel(
  data: Record<string, unknown>[],
  filename: string = "export.xlsx",
  sheetName: string = "Data"
) {
  const blob = exportToExcel(data, filename, sheetName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}