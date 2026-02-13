
import React from 'react';
import { ChatSession, ChatMode } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string) => void;
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  setCurrentSessionId, 
  activeMode,
  onModeChange,
  onNewChat,
  onDeleteChat,
  isOpen,
  setIsOpen
}) => {
  const modes: { id: ChatMode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'gemini', label: 'L1 Gemini', icon: <GeminiIcon />, color: 'hover:border-indigo-500' },
    { id: 'perplexity', label: 'L1 Perplexity', icon: <SearchIcon />, color: 'hover:border-emerald-500' },
    { id: 'grok', label: 'L1 Grok', icon: <GrokIcon />, color: 'hover:border-red-500' }
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-4 space-y-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-100 text-zinc-950 rounded-xl font-semibold hover:bg-white transition-all shadow-lg shadow-white/5"
        >
          <span>New Thread</span>
          <PlusIcon />
        </button>

        <div className="space-y-1">
          <p className="px-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Modes</p>
          <div className="grid grid-cols-1 gap-1">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${activeMode === mode.id 
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm' 
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                  }
                  ${mode.color}
                `}
              >
                <span className={activeMode === mode.id ? 'text-zinc-100' : 'text-zinc-500'}>
                  {mode.icon}
                </span>
                {mode.label}
                {activeMode === mode.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-4">
        <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">History</p>
        {sessions.map(session => (
          <div 
            key={session.id}
            className={`
              group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all
              ${currentSessionId === session.id ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}
            `}
            onClick={() => setCurrentSessionId(session.id)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                session.mode === 'perplexity' ? 'bg-emerald-500' : 
                session.mode === 'grok' ? 'bg-red-500' : 'bg-indigo-500'
              }`} />
              <span className="truncate text-sm font-medium">{session.title}</span>
            </div>
            {sessions.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Premium User</p>
            <p className="text-[10px] text-zinc-500 truncate">Settings & Profile</p>
          </div>
          <ChevronRightIcon />
        </div>
      </div>
    </div>
  );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const GeminiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const GrokIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default Sidebar;
