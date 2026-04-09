'use client'

import { Printer, Download } from 'lucide-react'

export function CertificateControls() {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white z-50 print:hidden transition hover:scale-105">
      <button 
        onClick={() => window.print()} 
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition"
      >
        <Printer size={14} /> Print Certificate
      </button>
      <button 
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition"
        onClick={() => alert('PDF generation is coming soon! For now, please use the Print option and Save as PDF.')}
      >
        <Download size={14} /> Download PDF
      </button>
    </div>
  )
}
