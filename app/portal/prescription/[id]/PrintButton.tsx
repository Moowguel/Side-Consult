"use client" 

import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <button 
        onClick={() => window.print()} 
        className="print:hidden absolute top-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition tooltip z-50"
        title="Imprimir Receita"
    >
        <Printer size={24} />
    </button>
  )
}