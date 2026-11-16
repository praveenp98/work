"use client";
import Papa from "papaparse";

/** Read every sheet of an uploaded CSV/TSV/XLSX file into row arrays. Runs in the browser; nothing is uploaded. */
export async function readTables(file: File): Promise<unknown[][][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) {
    const { default: readXlsxFile, readSheetNames } = await import("read-excel-file");
    const names = await readSheetNames(file);
    const out: unknown[][][] = [];
    for (const sheet of names) out.push((await readXlsxFile(file, { sheet })) as unknown[][]);
    return out;
  }
  if (name.endsWith(".xls")) throw new Error("Old .xls files aren't supported. Download the report as .xlsx or .csv.");
  const text = await file.text();
  const parsed = Papa.parse<unknown[]>(text, { skipEmptyLines: true });
  return [parsed.data];
}

export function download(filename: string, content: string | Blob, type = "text/csv;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob(["﻿" + content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
