'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';

export default function ChatClient() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);       
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);  
      } else {
        setMessages((prev) => [...prev, { role: 'ai', content: '⚠ Error: ' + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'ai', content: t.errorCon }]);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-[850px] relative mt-16 flex flex-col items-center">
      <div className="w-full bg-[#E5DBCA] rounded-[16px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex flex-col relative" style={{ border: '3px solid #8B6E4A' }}>
        
        {/* Etiqueta Superior */}
        <div className="absolute left-1/2 -top-[21px] -translate-x-1/2 bg-[#121927] border-[1.5px] border-[#E8C673] px-7 py-2 rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center min-w-[240px]">
          <span className="text-[#E8C673] text-[18px] mr-2">⚙</span>
          <span className="text-[#E8C673] font-bold text-[17px] tracking-wide">{t.expertBadge}</span>
        </div>

        {/* Zona de Mensajes */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 pt-[70px] pb-6 min-h-[200px] max-h-[30vh] md:max-h-[350px] text-[#312011] flex flex-col font-serif">

          {messages.length === 0 ? (
            <div className="text-center w-full mx-auto my-auto flex flex-col items-center justify-center">
              <h2 className="font-bold text-[28px] mb-3 text-[#312011] tracking-tight">{t.hello}</h2>
              <p className="text-[#4B3B2B] leading-relaxed text-[16px] max-w-xl mx-auto font-medium">
                {t.helloDesc}
              </p>
            </div>
          ) : (
            <div className="w-full space-y-5 flex flex-col justify-end h-full mt-auto font-sans">
              {messages.map((msg, index) => (
                <div key={index} className={"flex w-full "}>
                  <div
                    className={"max-w-[85%] px-5 py-3 rounded-[16px] whitespace-pre-wrap leading-relaxed text-[15px] shadow-sm font-medium "}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start w-full">
                  <div className="px-5 py-3 rounded-[16px] bg-[#F2EADA] border border-[#CBB596] text-[#69523C] font-sans text-[15px] rounded-bl-sm shadow-sm flex items-center gap-3">
                    <span className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-[#9B8161] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#9B8161] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[#9B8161] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </span>
                    <span className="font-medium">{t.thinking}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input / Botón */}
        <div className="px-6 md:px-10 pb-[36px] pt-1 flex gap-3 w-full bg-transparent">
          <input
            type="text"
            className="flex-1 bg-[#FCFAEA] border-2 border-[#BEA27B] text-[#312011] placeholder-[#87705B] rounded-[24px] px-6 py-[14px] focus:outline-none focus:ring-1 focus:ring-[#8B6E4A] transition-all font-sans text-[15px] md:text-[16px] shadow-inner font-medium"
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#A3855B] text-white font-bold tracking-wider px-8 md:px-10 py-[14px] rounded-[24px] shadow-md uppercase hover:bg-[#8B6E4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans text-[15px]"  
          >
            {t.send}
          </button>
        </div>

      </div>
    </div>
  );
}
