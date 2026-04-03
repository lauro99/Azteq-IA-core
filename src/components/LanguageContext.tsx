'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'ES' | 'EN';

const dictionary = {
  ES: {
    // HOME
    accessControl: "Control de Acceso",
    operatorId: "ID Operador...",
    accessCode: "Código de acceso...",
    enter: "Entrar",
    active: "Activo",
    iaExpert: "IA Experta (Manuales)",
    iaExpertDesc: "Asistente de Superinteligencia basado en los manuales oficiales de tu empresa. Resuelve dudas operativas en base a conocimiento guardado.",
    openChat: "Abrir Chat",
    comingSoon: "Próximamente",
    iaPlant: "IA Planta (Conexión PLC)",
    iaPlantDesc: "Monitoreo analítico predictivo en tiempo real conectado a sensores. Detecta posibles fallas y anomalías en las máquinas de forma autónoma.",
    inDevelopment: "En desarrollo...",
    footer: "© 2026 Azteq-IA. Sistema Operacional de Nueva Generación.",
    
    // CHAT
    returnBtn: "Retornar",
    expertBadge: "Azteq-IA Experto",
    hello: "¡Hola! Soy tu IA de Superinteligencia",
    helloDesc: "Pregúntame sobre los manuales técnicos guardados en nuestra base de datos. Si no encuentro la información exacta, usaré mi conocimiento general para ayudarte.",
    thinking: "Pensando...",
    placeholder: "Pregunta algo técnico (Ej: ¿A qué temperatura se calibra la XYZ-120?)...",
    send: "Enviar",
    errorCon: "⚠ Fallo al conectar con la API de chat."
  },
  EN: {
    // HOME
    accessControl: "Access Control",
    operatorId: "Operator ID...",
    accessCode: "Access Code...",
    enter: "Enter",
    active: "Active",
    iaExpert: "Expert AI (Manuals)",
    iaExpertDesc: "Superintelligence Assistant based on your company's official manuals. Solves operational doubts using stored knowledge.",
    openChat: "Open Chat",
    comingSoon: "Coming Soon",
    iaPlant: "Plant AI (PLC Connection)",
    iaPlantDesc: "Real-time predictive analytical monitoring connected to sensors. Autonomously detects possible machine faults and anomalies.",
    inDevelopment: "In development...",
    footer: "© 2026 Azteq-IA. Next Generation Operational System.",

    // CHAT
    returnBtn: "Return",
    expertBadge: "Azteq-IA Expert",
    hello: "Hello! I am your Superintelligence AI",
    helloDesc: "Ask me about the technical manuals stored in our database. If I can't find the exact information, I will use my general knowledge to help you.",
    thinking: "Thinking...",
    placeholder: "Ask something technical (e.g., At what temp is the XYZ-120 calibrated?)...",
    send: "Send",
    errorCon: "⚠ Failed to connect to the chat API."
  }
};

type ContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof dictionary['ES'];
};

const LanguageContext = createContext<ContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ES');
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionary[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
