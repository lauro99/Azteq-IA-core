'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function ChatClient() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Pre-procesar texto de la IA para convertir delimitadores \( \) a $ de KaTeX
  const preprocessMath = (text: string) => {
    return text
      .replace(/\\\((.*?)\\\)/g, '$$$1$$') // Inline math: \(...\) -> $...$
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$'); // Block math: \[...\] -> $$...$$
  };

  const sendMessageAPI = async (userMsg: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, userEmail })
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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    await sendMessageAPI(userMsg);
  };

  const handleEdit = (index: number) => {
    const msgToEdit = messages[index].content;
    setInput(msgToEdit);
    const newMessages = messages.slice(0, index);
    setMessages(newMessages);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async (index: number) => {
    let targetIndex = index;
    // Buscamos el último mensaje del usuario antes o en el índice actual
    while (targetIndex >= 0 && messages[targetIndex].role !== 'user') {
      targetIndex--;
    }
    if (targetIndex < 0) return;

    const prevMsg = messages[targetIndex];
    const newMessages = messages.slice(0, targetIndex + 1);
    setMessages(newMessages);
    
    await sendMessageAPI(prevMsg.content);
  };

  return (
    <div className="w-full max-w-[850px] relative mt-auto flex flex-col items-center">
      
      {/* Contenedor Principal (Estilo Piedra/Códice) */}
      <div className="w-full bg-[#E5DBCA]/95 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col relative border-[4px] border-[#69523C]" style={{ clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)' }}>

        {/* Adornos en las esquinas interiores (Motivo Escalonado) */}
        <div className="absolute top-1 left-1 w-6 h-6 border-t-4 border-l-4 border-[#A3855B] z-10 pointer-events-none"></div>
        <div className="absolute top-1 right-1 w-6 h-6 border-t-4 border-r-4 border-[#A3855B] z-10 pointer-events-none"></div>
        <div className="absolute bottom-1 left-1 w-6 h-6 border-b-4 border-l-4 border-[#A3855B] z-10 pointer-events-none"></div>
        <div className="absolute bottom-1 right-1 w-6 h-6 border-b-4 border-r-4 border-[#A3855B] z-10 pointer-events-none"></div>

        {/* Etiqueta Superior */}
        <div className="absolute left-1/2 -top-[2px] -translate-x-1/2 bg-[#121927] border-x-[3px] border-b-[3px] border-[#E8C673] px-8 py-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center min-w-[220px]" style={{ clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 100%, 0 100%)' }}>
          <span className="text-[#E8C673] text-[16px] mr-2">❂</span>
          <span className="text-[#E8C673] font-bold text-[14px] tracking-[0.2em] uppercase">{t.expertBadge}</span>
        </div>

        {/* Zona de Mensajes */}
        <div className="flex-1 overflow-y-auto px-5 md:px-10 pt-[50px] pb-6 min-h-[150px] max-h-[70vh] md:max-h-[65vh] text-[#312011] flex flex-col font-serif relative z-10">

          {messages.length === 0 ? (
            <div className="text-center w-full mx-auto my-auto flex flex-col items-center justify-center">
              <h2 className="font-bold text-[28px] mb-3 text-[#312011] tracking-tight">{t.hello}</h2>
              <p className="text-[#4B3B2B] leading-relaxed text-[16px] max-w-xl mx-auto font-medium">
                {t.helloDesc}
              </p>
            </div>
          ) : (
            <div className="w-full space-y-5 flex flex-col mt-auto font-sans">
              {messages.map((msg, index) => (
                <div key={index} className={"flex w-full flex-col " + (msg.role === 'user' ? 'items-end' : 'items-start')}>
                  <div
                    className={"max-w-[85%] px-6 py-4 leading-relaxed text-[15px] shadow-md font-medium relative " + 
                      (msg.role === 'user' 
                        ? 'bg-[#A3855B] text-[#FCFAEA] border-b-[4px] border-r-[4px] border-[#69523C]' 
                        : 'bg-[#F2EADA] border-l-[4px] border-t-[4px] border-[#CBB596] text-[#312011]')}
                    style={{
                      clipPath: msg.role === 'user' 
                        ? 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' 
                        : 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({node, ...props}) => <p className="m-0 mb-3 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-bold mb-2 mt-2" {...props} />,
                        code: ({node, inline, ...props}: any) => inline 
                          ? <code className="bg-black/10 px-1 py-0.5 rounded text-[13px] font-mono" {...props} />
                          : <code className="block bg-[#121927] text-white p-3 rounded-md overflow-x-auto mb-3 text-[13px] font-mono" {...props} />,
                        pre: ({node, ...props}) => <pre className="m-0 p-0 bg-transparent" {...props} />,
                        a: ({node, ...props}) => <a className="text-[#A3855B] underline hover:text-[#8B6E4A]" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#A3855B] pl-4 italic opacity-80 mb-3" {...props} />
                      }}
                    >
                      {msg.role === 'ai' ? preprocessMath(msg.content) : msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Botones de acción debajo del mensaje */}
                  <div className={"flex gap-3 mt-2 text-[11px] font-bold tracking-[0.15em] uppercase items-center opacity-90 " + (msg.role === 'user' ? 'mr-3' : 'ml-4')}>
                    {msg.role === 'user' ? (
                      <button 
                        onClick={() => handleEdit(index)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#A3855B]/10 hover:bg-[#A3855B]/20 text-[#69523C] hover:text-[#312011] transition-all border-b-[2px] border-r-[2px] border-transparent hover:border-[#A3855B]"
                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                        disabled={loading}
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        Editar
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleCopy(msg.content, index)}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 bg-[#F2EADA]/40 hover:bg-[#E5DBCA]/80 transition-all border-b-[2px] border-r-[2px] border-transparent hover:border-[#CBB596] ${copiedIndex === index ? 'text-[#312011]' : 'text-[#69523C] hover:text-[#312011]'}`}
                          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                        >
                          {copiedIndex === index ? (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-green-700"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : (
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
                          )}
                          {copiedIndex === index ? 'Copiado' : 'Copiar'}
                        </button>
                        <button 
                          onClick={() => handleRegenerate(index)}
                          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#F2EADA]/40 hover:bg-[#E5DBCA]/80 text-[#69523C] hover:text-[#312011] transition-all border-b-[2px] border-r-[2px] border-transparent hover:border-[#CBB596]"
                          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                          disabled={loading}
                        >
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                          Regenerar
                        </button>
                      </>
                    )}
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
        <div className="px-6 md:px-10 pb-[24px] pt-4 flex gap-4 w-full bg-[#D1C3AD]/50 border-t-4 border-[#A3855B] relative z-10">
          <input
            type="text"
            className="flex-1 bg-[#F2EADA] border-b-[4px] border-r-[4px] border-[#A3855B] text-[#312011] placeholder-[#87705B] px-6 py-[14px] focus:outline-none focus:bg-[#FCFAEA] transition-all font-sans text-[14px] md:text-[16px] shadow-inner font-medium"
            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="group relative bg-[#121927] text-[#E8C673] font-bold tracking-[0.2em] px-8 md:px-10 py-[14px] uppercase hover:bg-[#1A2624] hover:text-[#FBE7A1] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans text-[15px] border-b-[4px] border-r-[4px] border-[#E8C673]/50 hover:border-[#E8C673]"  
            style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
          >
            {t.send}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E8C673] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>
          </button>
        </div>

      </div>
    </div>
  );
}
