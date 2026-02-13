
import React, { useState, useEffect } from 'react';
import { Message, ChatSession, ChatMode } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import LiveOverlay from './components/LiveOverlay';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ChatMode>('gemini');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Initialize first session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      const newId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: newId,
        messages: [],
        title: 'New Conversation',
        mode: activeMode
      };
      setSessions([newSession]);
      setCurrentSessionId(newId);
    }
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleNewChat = (modeOverride?: ChatMode) => {
    const newId = crypto.randomUUID();
    const mode = modeOverride || activeMode;
    const newSession: ChatSession = {
      id: newId,
      messages: [],
      title: 'New Conversation',
      mode: mode
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const updateSessionMessages = (sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        let newTitle = s.title;
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg && s.title === 'New Conversation') {
          newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
        }
        return { ...s, messages, title: newTitle };
      }
      return s;
    }));
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleModeChange = (mode: ChatMode) => {
    setActiveMode(mode);
    // If current session is empty, just update its mode
    if (currentSession && currentSession.messages.length === 0) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, mode } : s));
    } else {
      // Otherwise start a new chat in that mode
      handleNewChat(mode);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onNewChat={() => handleNewChat()}
        onDeleteChat={handleDeleteSession}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors md:hidden"
            >
              <MenuIcon />
            </button>
            <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              Loop <span className="text-zinc-500 font-medium">AI</span>
              {currentSession && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-widest ${
                  currentSession.mode === 'perplexity' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                  currentSession.mode === 'grok' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                  'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                }`}>
                  L1 {currentSession.mode}
                </span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsLiveActive(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full text-xs font-medium transition-all group"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping group-hover:animate-none"></div>
              Go Live
            </button>
          </div>
        </header>

        <ChatWindow 
          session={currentSession}
          onUpdateMessages={(msgs) => currentSessionId && updateSessionMessages(currentSessionId, msgs)}
        />
        
        {isLiveActive && (
          <LiveOverlay onClose={() => setIsLiveActive(false)} />
        )}
      </main>
    </div>
  );
};

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

export default App;
