"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, Stethoscope, Loader2, Syringe, Video, MapPin } from 'lucide-react'
import { getDoctors, scheduleAppointment } from '@/app/actions/appointment-actions'

type Doctor = { id: string; name: string; specialty: string | null; crm: string | null }

const VACCINE_LIST = ["Influenza (Gripe)", "Covid-19 Bivalente", "Febre Amarela", "Tríplice Viral", "Tétano", "HPV"]

export default function NewAppointmentPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1) 
  const [appointmentType, setAppointmentType] = useState<'CONSULTA' | 'VACINA'>('CONSULTA')
  const [modality, setModality] = useState<'PRESENCIAL' | 'ONLINE'>('PRESENCIAL') 
  const [selectedVaccine, setSelectedVaccine] = useState<string | null>(null)
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { getDoctors().then(setDoctors) }, [])

  
  const generateSlots = () => {
    const slots: string[] = [] 
    const today = new Date()
    for (let d = 1; d <= 3; d++) {
        const date = new Date(today)
        date.setDate(today.getDate() + d)
        const hours = [9, 10, 11, 14, 15, 16]
        hours.forEach(h => {
            const slotDate = new Date(date)
            slotDate.setHours(h, 0, 0, 0)
            slots.push(slotDate.toISOString())
        })
    }
    return slots
  }

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedSlot) return
    if (appointmentType === 'VACINA' && !selectedVaccine) return

    setIsLoading(true)
    
    const result = await scheduleAppointment(
        selectedDoctor.id, 
        selectedSlot, 
        appointmentType, 
        selectedVaccine,
        appointmentType === 'VACINA' ? 'PRESENCIAL' : modality 
    )
    
    if (result.success) {
        alert("Solicitação enviada com sucesso!")
        router.push('/portal/history') 
        router.refresh()
    } else {
        alert(result.message)
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Nova Solicitação</h1>
                <p className="text-slate-500 text-sm">Passo {step} de 2</p>
            </div>
        </div>

        {step === 1 && (
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => { setAppointmentType('CONSULTA'); setSelectedVaccine(null); }}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${appointmentType === 'CONSULTA' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    <Stethoscope size={24} />
                    <span className="font-bold">Consulta Médica</span>
                </button>
                <button 
                    onClick={() => setAppointmentType('VACINA')}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${appointmentType === 'VACINA' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    <Syringe size={24} />
                    <span className="font-bold">Vacinação</span>
                </button>
            </div>
        )}

        {step === 1 && (
            <div className="animation-fade-in">
                
                {appointmentType === 'CONSULTA' && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Onde será o atendimento?</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setModality('PRESENCIAL')}
                                className={`p-4 rounded-xl border-2 flex items-center gap-3 transition ${modality === 'PRESENCIAL' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                <div className={`p-2 rounded-full ${modality === 'PRESENCIAL' ? 'bg-blue-200' : 'bg-slate-100'}`}><MapPin size={20}/></div>
                                <div className="text-left">
                                    <p className="font-bold">Presencial</p>
                                    <p className="text-xs opacity-80">Ir até o consultório</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setModality('ONLINE')}
                                className={`p-4 rounded-xl border-2 flex items-center gap-3 transition ${modality === 'ONLINE' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'bg-white border-slate-200 text-slate-500'}`}
                            >
                                <div className={`p-2 rounded-full ${modality === 'ONLINE' ? 'bg-purple-200' : 'bg-slate-100'}`}><Video size={20}/></div>
                                <div className="text-left">
                                    <p className="font-bold">Telemedicina</p>
                                    <p className="text-xs opacity-80">Videochamada online</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Vacinas */}
                {appointmentType === 'VACINA' && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-700 mb-4">Qual vacina deseja aplicar?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {VACCINE_LIST.map(vac => (
                                <button key={vac} onClick={() => setSelectedVaccine(vac)} className={`p-3 rounded-lg border text-left transition ${selectedVaccine === vac ? 'bg-orange-100 border-orange-500 text-orange-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'}`}>{vac}</button>
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="text-lg font-semibold text-slate-700 mb-4">Escolha o Profissional</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map(doc => (
                        <button 
                            key={doc.id}
                            onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                            disabled={appointmentType === 'VACINA' && !selectedVaccine}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                                    {doc.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{doc.name}</h3>
                                    <p className="text-sm text-slate-500">{doc.specialty || "Clínico Geral"}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {step === 2 && selectedDoctor && (
            <div className="animation-fade-in">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Resumo do Agendamento</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Tipo</span>
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                {appointmentType === 'VACINA' ? <><Syringe size={16}/> Vacinação</> : modality === 'ONLINE' ? <><Video size={16} className="text-purple-600"/> Telemedicina</> : <><MapPin size={16}/> Presencial</>}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Profissional</span>
                            <span className="font-bold text-slate-800">{selectedDoctor.name}</span>
                        </div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-blue-600 text-sm font-medium hover:underline mt-4">Alterar dados</button>
                 </div>

                 <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2"><Clock size={20} /> Horários Disponíveis</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                    {generateSlots().map((slot) => {
                        const dateObj = new Date(slot)
                        const isSelected = selectedSlot === slot
                        const dayStr = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(dateObj)
                        const hourStr = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(dateObj)
                        return (
                            <button key={slot} onClick={() => setSelectedSlot(slot)} className={`p-3 rounded-lg border text-center transition ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>
                                <div className={`text-xs font-bold mb-1 uppercase ${isSelected ? "text-blue-200" : "text-slate-400"}`}>{dayStr}</div>
                                <div className="text-lg font-bold">{hourStr}</div>
                            </button>
                        )
                    })}
                </div>

                <button disabled={!selectedSlot || isLoading} onClick={handleConfirm} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin"/> : <>Confirmar Solicitação <CheckCircle /></>}
                </button>
            </div>
        )}
      </div>
    </div>
  )
}