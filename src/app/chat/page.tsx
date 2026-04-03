import ChatClient from './ChatClient';

export default function ChatPage() {
  return (
    <div className="h-screen w-full bg-[#111] flex flex-col relative overflow-hidden bg-no-repeat bg-center"
         style={{ backgroundImage: 'url(/chat2_azteq.png)', backgroundSize: '100% 100%' }}>
      {/* Contenedor posicionado en la parte inferior para no tapar el rostro del Azteca */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-16 md:pb-24 px-4">
         <ChatClient />
      </div>
    </div>
  );
}
