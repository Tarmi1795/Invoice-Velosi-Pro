/**
 * PDF Utility for Invoice Velosi Pro
 * 
 * Provides standardized A4 exporting logic using browser-native print capabilities
 * optimized for Velosi templates.
 */

export const PDF_CONFIG = {
  format: 'A4',
  margins: {
    top: '15mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  }
};

/**
 * Triggers a professional PDF export for a specific invoice.
 * @param invoiceId The UUID of the invoice
 */
export async function exportInvoiceToPDF(invoiceId: string) {
  const url = `/api/generate-invoice?invoice_id=${invoiceId}&print=1`;
  const printWindow = window.open(url, '_blank');
  
  if (!printWindow) {
    alert("Please allow pop-ups to export PDF.");
    return;
  }
}

/**
 * Standard CSS overrides for A4 Print quality
 */
export const printStyles = `
  @media print {
    body { 
      margin: 0; 
      padding: 0; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
      background: white;
    }
    .no-print { display: none !important; }
    @page { 
      size: A4; 
      margin: 15mm 15mm 20mm 15mm; 
    }
    .invoice-container { 
      box-shadow: none !important; 
      border: none !important; 
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .items-table { 
      page-break-inside: auto; 
    }
    .items-table tr { 
      page-break-inside: avoid; 
      page-break-after: auto; 
    }
    .totals-section { 
      page-break-inside: avoid; 
    }
  }
`;
