import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

interface ExportPDFOptions {
  exportData: any[];
  columns: string[];
  title?: string;
  logo?: string;
  chartRef?: React.RefObject<HTMLDivElement>;
}

export async function exportTableAndChartToPDF({
  exportData,
  columns,
  title = "Statistik",
  logo,
  chartRef
}: ExportPDFOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = 14;

  // Logo und Headline
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 14, 8, 28, 28);
    } catch (error) {
      console.warn("Logo could not be added to PDF:", error);
    }
  }
  
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, logo ? 48 : 14, 20);
  
  // Subtitle with date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, logo ? 48 : 14, 28);

  y += 22;

  // Chart als PNG einbinden, falls Ref übergeben
  if (chartRef && chartRef.current) {
    try {
      const canvas = await html2canvas(chartRef.current, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");
      
      // Chart positioning and sizing
      const chartWidth = 120;
      const chartHeight = 70;
      doc.addImage(imgData, "PNG", 14, y, chartWidth, chartHeight);
      y += chartHeight + 8;
    } catch (error) {
      console.warn("Chart could not be captured:", error);
      // Add a placeholder text if chart capture fails
      doc.setFontSize(10);
      doc.text("Chart konnte nicht erfasst werden", 14, y);
      y += 10;
    }
  }

  // Tabelle darunter
  if (exportData && exportData.length > 0) {
    (doc as any).autoTable({
      startY: y,
      head: [columns],
      body: exportData.map(row => columns.map(col => {
        const value = row[col];
        if (typeof value === 'number') {
          return value.toFixed(2);
        }
        return value || '';
      })),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: "center",
        font: "helvetica"
      },
      headStyles: {
        fillColor: [236, 72, 153], // Pink color matching the theme
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light gray for alternating rows
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1
    });
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Seite ${i} von ${pageCount} • Cookie Business Dashboard`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Simplified version for quick exports without charts
export function exportSimplePDF(data: any[], title: string = "Bericht") {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);

  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => Object.values(obj));
    
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [236, 72, 153],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      }
    });
  }
  
  doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}