import { ReactNode } from 'react'

interface PrintLayoutProps {
  children: ReactNode
}

/** A4 paper container — content height only, ends naturally after footer + margin */
export default function PrintLayout({ children }: PrintLayoutProps) {
  return (
    <>
      <style>{`
        @media screen {
          body { background: #f3f4f6 !important; }
          .print-paper {
            max-width: 210mm;
            width: calc(100% - 64px);
            margin: 32px auto;
            padding: 12mm 18mm 25mm 18mm;
            background: #fff;
            box-shadow: 0 1px 8px rgba(0,0,0,0.07);
            border-radius: 1px;
            overflow: hidden;
            box-sizing: border-box;
          }
          .print-paper table { width: 100%; border-collapse: collapse; }
          .print-paper td, .print-paper th {
            overflow-wrap: break-word;
            word-wrap: break-word;
            vertical-align: top;
          }
        }
        @media print {
          @page { margin: 15mm 18mm; size: A4 portrait; }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
            background: transparent !important;
          }
          body, .print-paper {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, header, footer, .no-print, .print\\:hidden { display: none !important; }
          .print-paper {
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th, td { background: #fff !important; }
        }
      `}</style>
      <div className="print-paper">
        {children}
      </div>
    </>
  )
}
