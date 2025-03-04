import jsPDF from "jspdf";
import "jspdf-autotable";
import type { UserOptions } from "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

// Define types for the report data
interface ReportData {
  total_leases?: number;
  expected_rent?: number;
  total_rent_paid?: number;
  total_units?: number;
  occupied_units?: number;
  active_leases?: number;
  [key: string]: any;
}

// Define type for table row data
type TableRow = [string, string | number];

const LIGHT_GREEN = "#e8f5e9";
const DARKER_GREEN = "#81c784";
const TEXT_GREEN = "#2e7d32";

const exportEnhancedPDF = (
  data: ReportData,
  filename: string,
  reportType: string,
) => {
  // Create new document
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Add company logo placeholder
  doc.setFillColor(LIGHT_GREEN);
  doc.rect(0, 0, 220, 40, "F");

  // Add title
  doc.setFontSize(24);
  doc.setTextColor(TEXT_GREEN);
  doc.setFont("helvetica", "bold");
  doc.text(filename, 14, 25);

  // Add date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);

  const flattenedData = flattenDataForReport(data, reportType);

  // Add summary section
  doc.setFontSize(12);
  doc.setTextColor(TEXT_GREEN);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 50);

  // Add summary table with explicit typing
  doc.autoTable({
    startY: 55,
    head: [["Metric", "Value"]],
    body: getSummaryData(data, reportType) as TableRow[],
    theme: "grid",
    headStyles: {
      fillColor: DARKER_GREEN,
      textColor: "#FFFFFF",
      fontSize: 12,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: DARKER_GREEN,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: LIGHT_GREEN,
    },
  });

  // Add detailed information
  const detailsStartY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.setTextColor(TEXT_GREEN);
  doc.text("Detailed Information", 14, detailsStartY);

  // Add details table with explicit typing
  doc.autoTable({
    startY: detailsStartY + 5,
    head: [["Category", "Details"]],
    body: getDetailsData(flattenedData) as TableRow[],
    theme: "grid",
    headStyles: {
      fillColor: DARKER_GREEN,
      textColor: "#FFFFFF",
      fontSize: 12,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: DARKER_GREEN,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: LIGHT_GREEN,
    },
  });

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(TEXT_GREEN);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  doc.save(`${filename}.pdf`);
};

const getSummaryData = (data: ReportData, reportType: string): TableRow[] => {
  switch (reportType) {
    case "unit":
      return [
        ["Total Leases", data.total_leases ?? 0],
        ["Expected Rent", `KES ${(data.expected_rent ?? 0).toLocaleString()}`],
        [
          "Total Rent Paid",
          `KES ${(data.total_rent_paid ?? 0).toLocaleString()}`,
        ],
      ];
    case "property":
      return [
        ["Total Units", data.total_units ?? 0],
        ["Occupied Units", data.occupied_units ?? 0],
        ["Active Leases", data.active_leases ?? 0],
        ["Expected Rent", `KES ${(data.expected_rent ?? 0).toLocaleString()}`],
      ];
    case "tenant":
      return [
        ["Total Leases", data.total_leases ?? 0],
        ["Active Leases", data.active_leases ?? 0],
        ["Expected Rent", `KES ${(data.expected_rent ?? 0).toLocaleString()}`],
        [
          "Total Rent Paid",
          `KES ${(data.total_rent_paid ?? 0).toLocaleString()}`,
        ],
      ];
    default:
      return [];
  }
};

const getDetailsData = (flattenedData: Record<string, any>): TableRow[] => {
  return Object.entries(flattenedData).map(([key, value]) => [
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    value,
  ]);
};

const flattenDataForReport = (
  obj: ReportData,
  reportType: string,
): Record<string, any> => {
  const excludeKeys = [
    "total_leases",
    "expected_rent",
    "total_rent_paid",
    "total_units",
    "occupied_units",
    "active_leases",
  ];

  return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
    if (!excludeKeys.includes(key)) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          acc[key] = obj[key]
            .map((item: any) => JSON.stringify(item, null, 2))
            .join("\n\n");
        } else {
          Object.assign(acc, flattenDataForReport(obj[key], reportType));
        }
      } else {
        acc[key] = obj[key]?.toString() ?? "";
      }
    }
    return acc;
  }, {});
};

export { exportEnhancedPDF };
