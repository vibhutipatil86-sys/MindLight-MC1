
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Modality, Blob, LiveServerMessage } from '@google/genai';

interface LiveOverlayProps {
  onClose: () => void;
}

const LiveOverlay: React.FC<LiveOverlayProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [transcription, setTranscription] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let active = true;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Audio Contexts
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputAudioContext;

    const decode = (base64: string) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
    };

    const encode = (bytes: Uint8Array) => {
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const createBlob = (data: Float32Array): Blob => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
      }
      return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
      };
    };

    let stream: MediaStream | null = null;

    const startSession = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are Loop AI Live. You are in a real-time conversation. Be helpful, quick, and conversational. Use a witty Grok-like personality.',
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              if (!active) return;
              setStatus('active');
              const source = inputAudioContext.createMediaStreamSource(stream!);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              const analyzer = inputAudioContext.createAnalyser();
              analyzer.fftSize = 256;
              const bufferLength = analyzer.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                setAudioLevel(average / 128);

                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(analyzer);
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!active) return;
              
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: () => setStatus('error'),
            onclose: () => onClose(),
          }
        });

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      active = false;
      stream?.getTracks().forEach(t => t.stop());
      inputAudioContext.close();
      outputAudioContext.close();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-lg p-8 flex flex-col items-center gap-12 text-center">
        <div className="relative">
          {/* Audio Visualization Circles */}
          <div 
            className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" 
            style={{ transform: `scale(${1 + audioLevel * 1.5})`, opacity: 0.2 + audioLevel }}
          />
          <div 
            className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center relative z-10 shadow-2xl shadow-indigo-500/50"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse flex items-center justify-center">
              <MicIcon />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {status === 'connecting' ? 'Initializing Loop Live...' : status === 'error' ? 'Connection Error' : 'Loop is listening'}
          </h2>
          <p className="text-zinc-500 max-h-24 overflow-y-auto px-4 italic leading-relaxed">
            {transcription || "Say something witty..."}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-all"
          >
            End Conversation
          </button>
          <p className="text-xs text-zinc-600">Secure end-to-end encrypted session</p>
        </div>
      </div>
    </div>
  );
};

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>;

export default LiveOverlay;
