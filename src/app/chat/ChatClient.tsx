'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
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

  // Pre-procesar texto de la IA para convertir delimitadores \( \) a $ de KaTeX
  const preprocessMath = (text: string) => {
    return text
      .replace(/\\\((.*?)\\\)/g, '$$$1$$') // Inline math: \(...\) -> $...$
      .replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$'); // Block math: \[...\] -> $$...$$
  };

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
                <div key={index} className={"flex w-full " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={"max-w-[85%] px-5 py-3 rounded-[16px] leading-relaxed text-[15px] shadow-sm font-medium " + 
                      (msg.role === 'user' 
                        ? 'bg-[#E8C673] text-[#121927] rounded-br-sm' 
                        : 'bg-[#F2EADA] border border-[#CBB596] text-[#312011] rounded-bl-sm')}
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
