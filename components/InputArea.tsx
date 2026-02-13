
import React, { useState, useRef } from 'react';

interface InputAreaProps {
  onSendMessage: (text: string, image?: string) => void;
  useSearch: boolean;
  setUseSearch: (val: boolean) => void;
  forceSearch?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, useSearch, setUseSearch, forceSearch }) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !preview) return;
    onSendMessage(text, preview || undefined);
    setText('');
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSearchActive = forceSearch || useSearch;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {preview && (
        <div className="relative inline-block group">
          <img src={preview} className="w-20 h-20 object-cover rounded-lg border border-zinc-700" alt="Preview" />
          <button 
            type="button"
            onClick={() => setPreview(null)}
            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <XIcon />
          </button>
        </div>
      )}

      <div className="relative flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Loop anything..."
          className="w-full bg-transparent px-4 py-4 pr-32 focus:outline-none resize-none max-h-48 text-zinc-100 placeholder-zinc-500 text-sm leading-relaxed"
          rows={1}
        />

        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/50">
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
              title="Attach media"
            >
              <PaperclipIcon />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div className="h-4 w-[1px] bg-zinc-800 mx-1" />
            <button 
              type="button"
              disabled={forceSearch}
              onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isSearchActive 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'text-zinc-500 hover:text-zinc-300'
              } ${forceSearch ? 'cursor-default opacity-80' : ''}`}
            >
              <SearchIcon />
              {forceSearch ? 'Search Enabled' : 'Search'}
            </button>
          </div>

          <button 
            type="submit"
            disabled={!text.trim() && !preview}
            className={`
              p-2 rounded-xl transition-all
              ${(!text.trim() && !preview) ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-950 bg-white hover:bg-zinc-200'}
            `}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-center text-zinc-600 font-medium tracking-tight">Loop can make mistakes. Verify important info.</p>
    </form>
  );
};

const PaperclipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

export default InputArea;
