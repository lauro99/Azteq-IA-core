'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageContext';

interface RestrictedAccessProps {
  userEmail?: string;
  userPlan?: string;
}

export default function RestrictedAccess({ userEmail, userPlan }: RestrictedAccessProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Operador',
          email: userEmail || 'Desconocido',
          phone: phone || 'No provisto',
          company: company || 'No provista',
          plan: userPlan || 'Desconocido',
          message: `[SOPORTE/DESBLOQUEO] ${message || t.restrictedAccessBlocked}`,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        alert(t.ticketErrorMsg || 'Error al enviar el mensaje. Intenta de nuevo.');
      }
    } catch (err) {
      alert(t.connErrorMsg || 'Error de conexión.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <div className="bg-black/60 backdrop-blur-md border border-red-500/30 p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest">{t.restrictedAccess}</h2>
        
        {!showForm && !sent && (
          <>
            <p className="text-white/70 mb-8 font-light leading-relaxed">
              {t.restrictedAccessBlocked}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push('/')}
                className="bg-transparent border border-white/20 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest flex-1"
              >
                {t.backToHome}
              </button>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-red-500/20 border border-red-500/50 text-red-100 hover:bg-red-500/30 px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex-1"
              >
                {t.contactSupport}
              </button>
            </div>
          </>
        )}

        {showForm && !sent && (
          <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
            <p className="text-white/50 text-xs text-center mb-2">{t.ticketReviewInfo}</p>
            
            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.nameLabel}</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} disabled={isSending} className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50" />
            </div>
            
            <div className="flex sm:flex-row flex-col gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.companyPlant}</label>
                <input type="text" required value={company} onChange={(e) => setCompany(e.target.value)} disabled={isSending} className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.phoneLabel}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSending} className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-white/60 text-[10px] uppercase font-bold tracking-widest ml-1">{t.anomalyDetails}</label>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.restrictedAccessBlocked} disabled={isSending} rows={3} className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50 resize-none"></textarea>
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} disabled={isSending} className="bg-transparent border border-white/20 text-white/70 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex-1">
                {t.cancelBtn}
              </button>
              <button type="submit" disabled={isSending} className="bg-red-500/20 border border-red-500/50 text-red-100 hover:bg-red-500/30 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest flex-1">
                {isSending ? t.sendingTicket : t.sendTicket}
              </button>
            </div>
          </form>
        )}

        {sent && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-green-400 font-bold mb-6">{t.ticketSentMsg}</p>
            <p className="text-white/60 text-sm mb-6">{t.ticketReviewNext}</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-transparent border border-white/20 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              {t.backToHome}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
