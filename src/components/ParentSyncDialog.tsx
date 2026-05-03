'use client'

import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Loader2, 
  BellRing,
  Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { saveParentContact } from '@/app/actions/profile'

interface ParentSyncDialogProps {
  existingPhone?: string
}

export default function ParentSyncDialog({ existingPhone }: ParentSyncDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Show dialog if no parent phone exists and after a small delay
    if (!existingPhone) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [existingPhone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    
    setLoading(true)
    const result = await saveParentContact(phone.trim())
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setIsOpen(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md overflow-hidden rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
            >
              <X size={18} />
            </button>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md border border-white/30">
            <MessageSquare size={32} className="text-white" />
          </div>
        </div>

        <CardContent className="p-8 text-center">
          {success ? (
            <div className="space-y-4 py-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sync Successful!</h2>
              <p className="text-slate-500 text-sm font-medium">
                We'll now keep your guardian updated on your amazing ZIMSEC progress.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Unlock Parental Support</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Connect your parent's WhatsApp to share your study wins and get the support you need to ace your exams.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <BellRing size={20} className="text-emerald-500 mb-2" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Live Progress</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <ShieldCheck size={20} className="text-blue-500 mb-2" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Safe Sync</p>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel"
                    placeholder="Parent's WhatsApp Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-tight rounded-2xl group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      Connect Now <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Official ZimLearn AI Progress Sync
                </p>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
