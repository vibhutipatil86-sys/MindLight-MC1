
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, ChatSession, GroundingSource } from '../types';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';

interface ChatWindowProps {
  session: ChatSession | undefined;
  onUpdateMessages: (messages: Message[]) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, onUpdateMessages }) => {
  const [useSearch, setUseSearch] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, isTyping]);

  const handleSendMessage = async (text: string, image?: string) => {
    if (!session || (!text.trim() && !image)) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      image,
      timestamp: Date.now()
    };

    const updatedMessages = [...session.messages, userMessage];
    onUpdateMessages(updatedMessages);

    setIsTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const parts: any[] = [{ text }];
      if (image) {
        const [mimeType, base64Data] = image.split(',');
        parts.push({
          inlineData: {
            mimeType: mimeType.split(':')[1].split(';')[0],
            data: base64Data
          }
        });
      }

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      onUpdateMessages([...updatedMessages, assistantMessage]);

      // Mode-specific configurations
      let model = 'gemini-3-flash-preview';
      let systemInstruction = "You are Loop AI, a high-intelligence assistant.";
      let tools: any[] | undefined = useSearch ? [{ googleSearch: {} }] : undefined;

      if (session.mode === 'gemini') {
        model = 'gemini-3-pro-preview';
        systemInstruction = "You are Gemini L1, a sophisticated AI with advanced reasoning and creative capabilities. Provide thorough, logical, and structured responses.";
      } else if (session.mode === 'perplexity') {
        model = 'gemini-3-flash-preview';
        systemInstruction = "You are Perplexity L1. Your primary goal is to provide accurate, up-to-date information by always searching the web. Provide citations for all your facts.";
        tools = [{ googleSearch: {} }]; // Forced search for Perplexity mode
      } else if (session.mode === 'grok') {
        model = 'gemini-3-flash-preview';
        systemInstruction = "You are Grok L1, a witty AI with a sense of humor and a slightly rebellious streak. Be sharp, direct, edgy, and entertaining. Don't be afraid to be a bit spicy or sarcastic if it fits the context.";
      }

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
          tools,
        }
      });

      const textOutput = response.text || "Loop's processing circuits encountered an anomaly.";
      const groundingSources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Source',
        uri: chunk.web?.uri || '#'
      })) || [];

      const finalAssistantMessage: Message = {
        ...assistantMessage,
        content: textOutput,
        sources: groundingSources,
        isStreaming: false
      };

      onUpdateMessages([...updatedMessages, finalAssistantMessage]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "System Overload: Failed to retrieve data from the L1 node. Verify your connectivity and API status.",
        timestamp: Date.now(),
        isStreaming: false
      };
      onUpdateMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!session) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
          {session.messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl transition-all ${
                session.mode === 'perplexity' ? 'bg-emerald-500 shadow-emerald-500/20' :
                session.mode === 'grok' ? 'bg-red-500 shadow-red-500/20' :
                'bg-indigo-500 shadow-indigo-500/20'
              }`}>
                <span className="text-4xl font-black text-white -rotate-12">
                  {session.mode === 'gemini' ? 'G' : session.mode === 'perplexity' ? 'P' : 'X'}
                </span>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight">L1 {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} Mode</h2>
                <p className="text-zinc-500 text-lg">
                  {session.mode === 'gemini' ? 'Pure reasoning and creativity power.' : 
                   session.mode === 'perplexity' ? 'Real-time search and web grounding.' : 
                   'Witty, edgy, and unfiltered intelligence.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-8">
                {session.mode === 'perplexity' ? (
                  ['Recent news about SpaceX', 'Nvidia stock performance', 'Top 5 AI tools 2024', 'Weather in Tokyo'].map(suggestion => (
                    <button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="p-3 text-left text-sm bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all">{suggestion}</button>
                  ))
                ) : session.mode === 'grok' ? (
                  ['Roast the current state of social media', 'Write a savage haiku about work', 'What is the meaning of life? (Grok style)', 'Tell me a spicy tech joke'].map(suggestion => (
                    <button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="p-3 text-left text-sm bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all">{suggestion}</button>
                  ))
                ) : (
                  ['Explain quantum entanglement', 'Write a python script for a bot', 'Summarize The Great Gatsby', 'Plan a 3-day trip to Paris'].map(suggestion => (
                    <button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="p-3 text-left text-sm bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all">{suggestion}</button>
                  ))
                )}
              </div>
            </div>
          ) : (
            session.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          {isTyping && (
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                <div className="space-y-2 flex-1">
                   <div className="h-4 bg-zinc-800 rounded w-1/4 animate-pulse" />
                   <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse" />
                </div>
             </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="max-w-3xl mx-auto">
          <InputArea 
            onSendMessage={handleSendMessage} 
            useSearch={useSearch} 
            setUseSearch={setUseSearch} 
            forceSearch={session.mode === 'perplexity'}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
