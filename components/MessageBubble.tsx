
import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} group`}>
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
        ${isUser ? 'bg-zinc-100 text-zinc-950' : 'bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white'}
      `}>
        {isUser ? 'U' : 'L'}
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
        <div className={`
          px-4 py-3 rounded-2xl leading-relaxed text-sm
          ${isUser ? 'bg-zinc-800 text-zinc-100' : 'bg-transparent border border-zinc-800/0 text-zinc-200'}
        `}>
          {message.image && (
            <div className="mb-3">
              <img 
                src={message.image} 
                alt="User upload" 
                className="max-h-60 rounded-xl border border-zinc-700 object-cover" 
              />
            </div>
          )}
          <div className="whitespace-pre-wrap jetbrains-mono">
            {message.content}
          </div>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
             <p className="w-full text-[10px] font-bold text-zinc-600 uppercase mb-1">Sources</p>
             {message.sources.map((source, idx) => (
               <a 
                 key={idx}
                 href={source.uri} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
               >
                 <LinkIcon />
                 <span className="truncate max-w-[120px]">{source.title}</span>
               </a>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;

export default MessageBubble;
