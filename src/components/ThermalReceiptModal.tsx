import React, { useState } from 'react';
import {
  Check,
  CheckCircle,
  Copy,
  Download,
  Printer,
  Receipt,
  RotateCcw,
  Sliders,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Invoice } from '../types';
import { formatPKR, formatThermalPKR } from '../utils/currency';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ invoice, onClose }) => {
  const { company, currentUser } = useBilling();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Generate plain-text ESC/POS style receipt for copying or serial raw printing
  const generateRawText = () => {
    const divider = paperWidth === '80mm'
      ? '================================================'
      : '================================';
    const subDivider = paperWidth === '80mm'
      ? '------------------------------------------------'
      : '--------------------------------';

    const lines: string[] = [
      company.name.toUpperCase(),
      company.address,
      company.phone,
      company.taxId,
      divider,
      `RECEIPT #: ${invoice.id}`,
      `DATE: ${invoice.issueDate}   TIME: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      `OPERATOR: ${invoice.createdByName || currentUser?.username || 'Staff'}`,
      `BILLED TO: ${invoice.clientName}`,
      divider,
      paperWidth === '80mm'
        ? 'ITEM                      QTY    PRICE     TOTAL'
        : 'ITEM             QTY   RATE   TOTAL',
      subDivider,
    ];

    invoice.items.forEach(item => {
      const name = item.description.slice(0, paperWidth === '80mm' ? 24 : 15);
      const qty = item.quantity;
      const rate = formatThermalPKR(item.unitPrice);
      const tot = formatThermalPKR(item.total);
      lines.push(`${name}`);
      lines.push(`  ${qty} x ${rate} = ${tot}`);
    });

    lines.push(subDivider);
    lines.push(`SUBTOTAL:           ${formatThermalPKR(invoice.subtotal)}`);
    if (invoice.discountTotal > 0) {
      lines.push(`DISCOUNT:          -${formatThermalPKR(invoice.discountTotal)}`);
    }
    if (invoice.taxTotal > 0) {
      lines.push(`SALES TAX (GST):    ${formatThermalPKR(invoice.taxTotal)}`);
    }
    lines.push(divider);
    lines.push(`TOTAL (PKR):        ${formatThermalPKR(invoice.total)}`);
    lines.push(`AMOUNT PAID:        ${formatThermalPKR(invoice.amountPaid)}`);
    lines.push(`BALANCE DUE:        ${formatThermalPKR(invoice.amountDue)}`);
    lines.push(`STATUS:             ${invoice.status.toUpperCase()}`);
    lines.push(divider);
    lines.push('       THANK YOU FOR YOUR BUSINESS!       ');
    lines.push('             SHUKRIYA / جزاک اللہ         ');
    lines.push('  Software: AuraBill POS Automated System ');

    return lines.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateRawText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl w-full my-6 p-4 sm:p-6 shadow-2xl flex flex-col print:bg-white print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Thermal POS Receipt Generator
              </h3>
              <p className="text-[11px] text-slate-400">
                Optimized for 80mm &amp; 58mm thermal receipt printers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Selector */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                  paperWidth === '80mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm (3")
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                  paperWidth === '58mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                58mm (2")
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Thermal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container Preview */}
        <div className="py-6 flex justify-center overflow-x-auto print:p-0 print:m-0">
          <div
            id="thermal-receipt-printable"
            className={`bg-white text-black p-4 sm:p-5 shadow-2xl font-mono text-[12px] leading-tight select-text ${
              paperWidth === '80mm' ? 'w-[320px]' : 'w-[240px]'
            } print:w-full print:shadow-none print:p-1 print:m-0 print:border-none`}
            style={{
              fontFamily: "'Courier New', Courier, 'JetBrains Mono', monospace",
              color: '#000',
              backgroundColor: '#fff',
            }}
          >
            {/* Business Logo & Name */}
            <div className="text-center pb-2">
              <h2 className="font-bold text-sm sm:text-base uppercase tracking-wider text-black">
                {company.name}
              </h2>
              <p className="text-[10px] text-black mt-0.5">{company.address}</p>
              <p className="text-[10px] text-black">Tel: {company.phone}</p>
              <p className="text-[10px] text-black font-bold mt-0.5">{company.taxId}</p>
            </div>

            <div className="text-center text-[10px] py-1 border-t border-b border-black border-dashed my-2">
              *** POS CASH &amp; COMMERCIAL RECEIPT ***
            </div>

            {/* Receipt Meta */}
            <div className="text-[11px] space-y-1 pb-2">
              <div className="flex justify-between">
                <span>RECEIPT #:</span>
                <span className="font-bold">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{invoice.issueDate}</span>
              </div>
              <div className="flex justify-between">
                <span>OPERATOR:</span>
                <span>{invoice.createdByName || currentUser?.username || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>BILLED TO:</span>
                <span className="font-bold truncate max-w-[160px]">{invoice.clientName}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border-t border-b border-black border-dashed py-1.5 my-1">
              <div className="flex justify-between text-[10px] font-bold pb-1">
                <span>ITEM / DESCRIPTION</span>
                <span>TOTAL (PKR)</span>
              </div>
              <div className="space-y-1.5">
                {invoice.items.map((item, idx) => (
                  <div key={item.id || idx} className="text-[11px]">
                    <div className="font-semibold leading-tight">{item.description}</div>
                    <div className="flex justify-between text-[10px]">
                      <span>{item.quantity} x {formatThermalPKR(item.unitPrice)}</span>
                      <span className="font-bold">{formatThermalPKR(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="space-y-1 pt-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatThermalPKR(invoice.subtotal)}</span>
              </div>

              {invoice.discountTotal > 0 && (
                <div className="flex justify-between">
                  <span>DISCOUNT:</span>
                  <span>-{formatThermalPKR(invoice.discountTotal)}</span>
                </div>
              )}

              {invoice.taxTotal > 0 && (
                <div className="flex justify-between">
                  <span>SALES TAX (GST):</span>
                  <span>{formatThermalPKR(invoice.taxTotal)}</span>
                </div>
              )}

              {invoice.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>DELIVERY / TCS:</span>
                  <span>{formatThermalPKR(invoice.shippingFee)}</span>
                </div>
              )}

              <div className="border-t-2 border-black pt-1 flex justify-between font-bold text-[13px]">
                <span>TOTAL (PKR):</span>
                <span>{formatThermalPKR(invoice.total)}</span>
              </div>

              <div className="flex justify-between font-bold text-black pt-0.5">
                <span>AMOUNT PAID:</span>
                <span>{formatThermalPKR(invoice.amountPaid)}</span>
              </div>

              <div className="flex justify-between font-bold text-black border-t border-black border-dashed pt-1">
                <span>BALANCE DUE:</span>
                <span>{formatThermalPKR(invoice.amountDue)}</span>
              </div>
            </div>

            {/* Payment Record Breakdown */}
            {invoice.payments.length > 0 && (
              <div className="border-t border-black border-dashed mt-2 pt-1 text-[10px]">
                <div className="font-bold">PAYMENTS RECEIVED:</div>
                {invoice.payments.map(p => (
                  <div key={p.id} className="flex justify-between text-[9px]">
                    <span>{p.paymentDate} ({p.paymentMethod.toUpperCase()})</span>
                    <span>{formatThermalPKR(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Status Stamp */}
            <div className="my-3 py-1 text-center font-bold text-[12px] border-2 border-black uppercase tracking-widest">
              {invoice.status === 'paid' ? 'PAID IN FULL / ادا شدہ' : `${invoice.status.toUpperCase()} / بقایا`}
            </div>

            {/* Simulated POS Barcode */}
            <div className="text-center py-2">
              <div className="inline-block tracking-widest font-mono text-[14px] font-bold select-none">
                ||| | ||||| || |||| ||| ||| |||
              </div>
              <div className="text-[9px] mt-0.5">{invoice.id}</div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] pt-1 border-t border-black border-dashed space-y-0.5">
              <p className="font-bold">THANK YOU FOR YOUR BUSINESS!</p>
              <p className="font-urdu">شکریہ - Shukriya</p>
              <p className="text-[8px] text-gray-700">Goods once sold can be exchanged within 7 days with this original receipt.</p>
              <p className="text-[8px] text-gray-600 font-mono">AuraBill POS · Automated Accounting</p>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar (Hidden on print) */}
        <div className="no-print pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-medium">Thermal Tip:</span>
            <span>Set printer paper to 80mm or 58mm roll with 0mm margins in print dialog.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied ESC/POS Text' : 'Copy Text Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
