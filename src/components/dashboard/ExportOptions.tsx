import type React from "react";
import { Button } from "@/components/ui/button";
import {
  DownloadCloud,
  Printer,
  FileSpreadsheet,
  FileIcon,
} from "lucide-react";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { exportEnhancedPDF } from "./ExportEnhancedPdf";

interface ExportOptionsProps {
  data: any;
  filename: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  data,
  filename,
}) => {
  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.entries(flattenData(data))
        .map(([key, value]) => `${key},${JSON.stringify(value)}`)
        .join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const flattenedData = flattenData(data);
      const ws = XLSX.utils.json_to_sheet([flattenedData]);
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("An error occurred while exporting to Excel. Please try again.");
    }
  };

  const exportPDF = () => {
    exportEnhancedPDF(data, filename, getReportType());
  };

  // Add this helper function to determine report type
  const getReportType = () => {
    if (data.hasOwnProperty("total_units")) return "property";
    if (data.hasOwnProperty("lease_transfers")) return "tenant";
    return "unit";
  };

  const printReport = () => {
    const printContent = document.getElementById("report-content");
    const WinPrint = window.open("", "", "width=900,height=650");
    WinPrint?.document.write(printContent?.innerHTML || "");
    WinPrint?.document.close();
    WinPrint?.focus();
    WinPrint?.print();
    WinPrint?.close();
  };

  const flattenData = (obj: any, prefix = ""): { [key: string]: string } => {
    return Object.keys(obj).reduce((acc: { [key: string]: string }, k) => {
      const pre = prefix.length ? prefix + "." : "";
      if (typeof obj[k] === "object" && obj[k] !== null) {
        if (Array.isArray(obj[k])) {
          acc[pre + k] = obj[k]
            .map((item: any) =>
              typeof item === "object" ? JSON.stringify(item) : item,
            )
            .join(", ");
        } else {
          Object.assign(acc, flattenData(obj[k], pre + k));
        }
      } else {
        acc[pre + k] = obj[k]?.toString() ?? "";
      }
      return acc;
    }, {});
  };

  return (
    <div className="flex justify-end space-x-2 mb-4">
      <Button variant="outline" onClick={exportCSV}>
        <DownloadCloud className="mr-2 h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" onClick={exportExcel}>
        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
      </Button>
      <Button variant="outline" onClick={exportPDF}>
        <FileIcon className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" onClick={printReport}>
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
};
