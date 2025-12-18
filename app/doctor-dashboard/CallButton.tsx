"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { startAttendance } from "@/app/actions/medical-actions"


interface CallButtonProps {
    triageId: string
    patientId: string
}

export default function CallButton({ triageId, patientId }: CallButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleCall = async () => {
        setLoading(true)
        const result = await startAttendance(triageId, patientId)
        
        if (result.success && result.appointmentId) {
            router.push(`/doctor-dashboard/attend/${result.appointmentId}`)
        } else {
            alert("Erro ao iniciar atendimento.")
            setLoading(false)
        }
    }

    return (
        <button 
            onClick={handleCall}
            disabled={loading}
            className="w-full lg:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-70 whitespace-nowrap"
        >
            {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    Chamar Paciente <ArrowRight size={18} />
                </>
            )}
        </button>
    )
}