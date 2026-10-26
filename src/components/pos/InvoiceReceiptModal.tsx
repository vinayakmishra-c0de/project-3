import React from 'react';
import { StudentSaleRecord } from '../../types';
import { exportToExcel, exportToCSV } from '../../utils/excelUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, FileText, X, CheckCircle, User } from 'lucide-react';

interface InvoiceReceiptModalProps {
  invoice: StudentSaleRecord | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  // Download invoice as Excel
  const handleDownloadExcel = () => {
    const data = invoice.items.map((item, idx) => ({
      'Item No': idx + 1,
      'Item Code': item.code,
      'Item Description': item.name,
      Size: item.size,
      'MRP (₹)': item.mrp,
      Quantity: item.quantity,
      'Subtotal (₹)': item.subtotal,
    }));

    // Summary rows
    data.push(
      {
        'Item No': '',
        'Item Code': '',
        'Item Description': 'Gross Subtotal',
        Size: '',
        'MRP (₹)': 0,
        Quantity: 0,
        'Subtotal (₹)': invoice.grossTotal,
      } as any,
      {
        'Item No': '',
        'Item Code': '',
        'Item Description': `Discount (${invoice.discountType === 'percent' ? `${invoice.discountValue}%` : 'Flat'})`,
        Size: '',
        'MRP (₹)': 0,
        Quantity: 0,
        'Subtotal (₹)': -invoice.discountAmount,
      } as any,
      {
        'Item No': '',
        'Item Code': '',
        'Item Description': `Net Total Paid (${invoice.paymentMode})`,
        Size: '',
        'MRP (₹)': 0,
        Quantity: 0,
        'Subtotal (₹)': invoice.netAmount,
      } as any
    );

    exportToExcel(data, `NEPS_Invoice_${invoice.invoiceNo}`, 'Invoice');
  };

  // Download invoice as CSV
  const handleDownloadCSV = () => {
    const data = invoice.items.map((item, idx) => ({
      ItemNo: idx + 1,
      ItemCode: item.code,
      Description: item.name,
      Size: item.size,
      Rate: item.mrp,
      Qty: item.quantity,
      Subtotal: item.subtotal,
    }));
    exportToCSV(data, `NEPS_Invoice_${invoice.invoiceNo}`);
  };

  // Download invoice as PDF via jsPDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // Top Header: ONLY "NEPS" and "UNIFORM DIVISION"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(15, 39, 68);
    doc.text('NEPS', doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });

    const isBooksInvoice = invoice.division === 'books';
    const divisionTitle = isBooksInvoice ? 'BOOKS & STATIONERY DIVISION' : 'UNIFORM DIVISION';

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (isBooksInvoice) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(37, 99, 235);
    }
    doc.text(divisionTitle, doc.internal.pageSize.getWidth() / 2, 72, { align: 'center' });

    // Thin separator line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1);
    doc.line(40, 85, doc.internal.pageSize.getWidth() - 40, 85);

    // Invoice & Student Details
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');

    // Left column
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 40, 105);
    doc.text(`Date & Time: ${invoice.date} • ${invoice.time}`, 40, 120);
    doc.text(`Cashier / Terminal: ${invoice.cashierName}`, 40, 135);

    // Right column: Student info
    doc.setFont('helvetica', 'bold');
    doc.text(`Student: ${invoice.studentName}`, 320, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`Class/Grade: ${invoice.studentClass}`, 320, 120);
    doc.text(`Roll/Admission: ${invoice.rollNoAdmission || 'N/A'}`, 320, 135);
    doc.text(`Contact: ${invoice.contactNo || 'N/A'}`, 320, 150);

    // Table of Items
    const tableData = invoice.items.map((item, idx) => [
      String(idx + 1),
      `${item.name} (${item.code})`,
      item.size,
      `₹${item.mrp.toFixed(2)}`,
      String(item.quantity),
      `₹${item.subtotal.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 165,
      head: [['#', 'Item Description', 'Size', 'Rate', 'Qty', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 39, 68],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 70, halign: 'right' },
        4: { cellWidth: 40, halign: 'center' },
        5: { cellWidth: 80, halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;

    // Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gross Subtotal:`, 380, finalY);
    doc.text(`₹${invoice.grossTotal.toFixed(2)}`, 530, finalY, { align: 'right' });

    let currentY = finalY;
    if (invoice.discountAmount > 0) {
      currentY += 15;
      doc.text(
        `Discount (${invoice.discountType === 'percent' ? `${invoice.discountValue}%` : 'Flat'}):`,
        380,
        currentY
      );
      doc.text(`- ₹${invoice.discountAmount.toFixed(2)}`, 530, currentY, { align: 'right' });
    }

    currentY += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 39, 68);
    doc.text(`Net Payable:`, 380, currentY);
    doc.text(`₹${invoice.netAmount.toFixed(2)}`, 530, currentY, { align: 'right' });

    currentY += 16;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Payment Mode: ${invoice.paymentMode} (PAID)`, 380, currentY);

    if (invoice.notes) {
      currentY += 14;
      doc.text(`Notes: ${invoice.notes}`, 380, currentY);
    }

    // Save PDF
    doc.save(`NEPS_Invoice_${invoice.invoiceNo}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Top Header Actions (Download as Excel, CSV, PDF) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Invoice Ready</h3>
              <p className="text-xs text-slate-500">#{invoice.invoiceNo} • {invoice.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download as PDF */}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download formatted PDF receipt"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Download as Excel */}
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download receipt as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            {/* Download as CSV */}
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download as CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Receipt Document Content */}
        <div className="p-6 md:p-8 bg-white overflow-y-auto text-slate-800 text-sm">
          {/* Header strictly: ONLY "NEPS" and "UNIFORM DIVISION" */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <h1 className="text-3xl font-black text-slate-900 tracking-wider">
              NEPS
            </h1>
            <h2 className={`text-sm font-bold tracking-widest uppercase mt-0.5 ${invoice.division === 'books' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {invoice.division === 'books' ? 'BOOKS & STATIONERY DIVISION' : 'UNIFORM DIVISION'}
            </h2>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <div className="text-slate-500">Invoice No:</div>
              <div className="font-bold text-slate-900 font-mono text-sm">{invoice.invoiceNo}</div>
              <div className="text-slate-500 mt-2">Date & Time:</div>
              <div className="font-medium text-slate-800">{invoice.date} • {invoice.time}</div>
              <div className="text-slate-500 mt-2">Cashier:</div>
              <div className="font-medium text-slate-800">{invoice.cashierName}</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-700" />
                <span>Student Details</span>
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">Name: </span>
                  <span className="font-semibold text-slate-900">{invoice.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Class/Grade: </span>
                  <span className="font-semibold text-slate-900">{invoice.studentClass}</span>
                </div>
                <div>
                  <span className="text-slate-500">Roll/Adm ID: </span>
                  <span className="font-mono font-medium text-slate-800">{invoice.rollNoAdmission || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Contact: </span>
                  <span className="font-mono text-slate-800">{invoice.contactNo || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left text-slate-700 uppercase tracking-wider font-bold">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2">Size</th>
                  <th className="py-2 px-2 text-right">MRP (₹)</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 pl-2 text-right">Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.code}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-2.5 pl-2 text-right font-mono font-semibold text-slate-900">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div className="border-t-2 border-slate-900 pt-3 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono">₹{invoice.grossTotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Discount {invoice.discountType === 'percent' ? `(${invoice.discountValue}%)` : '(Flat)'}:
                  </span>
                  <span className="font-mono">- ₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-300 pt-1.5">
                <span>Net Payable:</span>
                <span className="font-mono text-base text-blue-900">₹{invoice.netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-slate-800">{invoice.paymentMode} (PAID)</span>
              </div>
              {invoice.notes && (
                <div className="text-[11px] text-slate-500 italic pt-1">
                  Remark: {invoice.notes}
                </div>
              )}
            </div>
          </div>

          {/* Exchange & Refund Audit Trail */}
          {invoice.exchangeLogs && invoice.exchangeLogs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Exchange & Refund Audit Trail:
              </div>
              <div className="space-y-1.5">
                {invoice.exchangeLogs.map((log) => (
                  <div key={log.id} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-start justify-between gap-2">
                    <div>
                      <span className={`font-bold ${log.type === 'Exchange' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        [{log.type.toUpperCase()}]
                      </span>{' '}
                      <span className="text-slate-500 text-[10px] font-mono">{log.date} ({log.time})</span> —{' '}
                      {log.type === 'Exchange'
                        ? `${log.quantity}x ${log.originalItemName} (${log.originalSize}) ➔ ${log.replacementItemName} (${log.replacementSize})`
                        : `Returned ${log.quantity}x ${log.originalItemName} (${log.originalSize})`}
                      <span className="text-slate-500 italic"> ({log.reason})</span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 shrink-0">
                      {log.type === 'Exchange'
                        ? log.priceDifference && log.priceDifference > 0
                          ? `+₹${log.priceDifference.toFixed(2)}`
                          : log.priceDifference && log.priceDifference < 0
                          ? `-₹${Math.abs(log.priceDifference).toFixed(2)}`
                          : '₹0 (Even)'
                        : `₹${log.refundAmount?.toFixed(2)} (${log.refundPaymentMode})`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Export formats: PDF, Excel (.xlsx), CSV (.csv)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
