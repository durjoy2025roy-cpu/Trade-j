import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { AiChatMessage } from '../types';
import { soundEngine } from '../utils/soundEngine';

interface DurjoyAiSectionProps {
  onInsertEducationalNote?: (note: string) => void;
}

const QUICK_PROMPTS = [
  { label: 'FVG কি?', prompt: 'FVG কি এবং ICT Silver Bullet-এ এটা কীভাবে ব্যবহার করব?' },
  { label: 'PDH & PDL কী?', prompt: 'PDH আর PDL কী? এগুলো কেন গুরুত্বপূর্ণ?' },
  { label: '1:3 RRR হিসাব', prompt: '1:3 RRR কিভাবে হিসাব করব উদাহরণসহ বুঝিয়ে দাও।' },
  { label: 'সেশনের সময় (BST)', prompt: 'London session আর New York session এর সময় কত বাংলাদেশ সময় অনুযায়ী?' },
  { label: 'MSS vs Sweep', prompt: 'Market Structure Shift (MSS) এবং Liquidity Sweep এর মধ্যে পার্থক্য কী?' },
  { label: 'Psychology Tip', prompt: 'ট্রেডিং সাইকোলজি ও লস রিকভারি FOMO নিয়ন্ত্রণ করার উপায় কী?' },
];

export const DurjoyAiSection: React.FC<DurjoyAiSectionProps> = ({ onInsertEducationalNote }) => {
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('trade_gate_durjoy_ai_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'welcome_1',
        role: 'ai',
        text: 'নমস্কার Durjoy! আমি Durjoy AI — তোমার পার্সোনাল ট্রেডিং এডুকেশনাল ও লার্নিং অ্যাসিস্ট্যান্ট।\n\nICT Silver Bullet, 9/20 EMA Swing, Risk Management, FVG, লিকুইডিটি অথবা কোনো চার্ট স্ক্রিনশট নিয়ে যেকোনো শিক্ষামূলক প্রশ্ন করতে পারো (বাংলা, English বা Banglish)।\n\n📌 মনে রেখো: আমি কোনো অটোমেটিক ট্রেড সিগন্যাল বা প্রফিট গ্যারান্টি দিই না। Trade Gate approval তোমার সম্পূর্ণ নিজস্ব ডিসিপ্লিনারি দায়িত্ব।',
        timestamp: Date.now(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Interaction State: MIC OFF | MIC ON | LISTENING | THINKING | SPEAKING
  type VoiceState = 'MIC_OFF' | 'MIC_ON' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  const [voiceState, setVoiceState] = useState<VoiceState>('MIC_OFF');
  const [voiceLang, setVoiceLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Save conversation to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('trade_gate_durjoy_ai_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Handle Speech Recognition
  const toggleVoice = () => {
    if (!isSpeechSupported) {
      alert('Your current browser does not support Web Speech Recognition. You can still use standard text chat.');
      return;
    }

    if (voiceState === 'LISTENING') {
      // Stop listening
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch {}
      setVoiceState('MIC_OFF');
      soundEngine.play('button_click');
      return;
    }

    // Start listening
    try {
      soundEngine.play('button_click');
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.lang = voiceLang;
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setVoiceState('LISTENING');
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Automatically trigger handleSend
          sendMessage(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Voice recognition error:', e.error);
        setVoiceState('MIC_OFF');
      };

      rec.onend = () => {
        if (voiceState === 'LISTENING') {
          setVoiceState('MIC_OFF');
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setVoiceState('MIC_OFF');
    }
  };

  // Text-To-Speech (TTS)
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop prior audio
      // Clean markdown tokens
      const cleanText = text.replace(/[*_#`[\]()]/g, '').slice(0, 400);
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Check if text is mostly Bengali or English
      const hasBengali = /[\u0980-\u09FF]/.test(text);
      utterance.lang = hasBengali ? 'bn-BD' : 'en-US';
      utterance.rate = 1.0;

      utterance.onstart = () => setVoiceState('SPEAKING');
      utterance.onend = () => setVoiceState('MIC_OFF');
      utterance.onerror = () => setVoiceState('MIC_OFF');

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS error:', err);
      setVoiceState('MIC_OFF');
    }
  };

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      soundEngine.play('warning');
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      soundEngine.play('warning');
      alert('Image size exceeds 5MB limit. Please upload a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
      soundEngine.play('data_saved');
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    soundEngine.play('button_click');
  };

  // Send message
  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    const trimmed = textToSend.trim();

    if (!trimmed && !selectedImage) return;
    if (loading) return;

    soundEngine.play('button_click');
    setLoading(true);
    if (voiceState === 'LISTENING') {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch {}
    }
    setVoiceState('THINKING');

    const userMsgId = 'user_' + Date.now();
    const userMsg: AiChatMessage = {
      id: userMsgId,
      role: 'user',
      text: trimmed || 'Analyze uploaded chart image',
      imageUrl: selectedImage?.previewUrl,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const payloadImage = selectedImage
      ? {
          mimeType: selectedImage.mimeType,
          data: selectedImage.base64,
        }
      : undefined;

    // Reset current selected image
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          image: payloadImage,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'No response received.';

      const aiMsg: AiChatMessage = {
        id: 'ai_' + Date.now(),
        role: 'ai',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      soundEngine.play('ai_response_ready');

      // Speak text if TTS is enabled
      if (ttsEnabled) {
        speakText(replyText);
      } else {
        setVoiceState('MIC_OFF');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      soundEngine.play('warning');
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_err_' + Date.now(),
          role: 'ai',
          text: 'Durjoy AI সাময়িকভাবে অনুপলব্ধ। ইন্টারনেট সংযোগ পরীক্ষা করো অথবা পরে আবার চেষ্টা করো।',
          timestamp: Date.now(),
          isError: true,
        },
      ]);
      setVoiceState('MIC_OFF');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    soundEngine.play('button_click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    soundEngine.play('button_click');
    if (window.confirm('Clear all conversation history with Durjoy AI?')) {
      setMessages([
        {
          id: 'welcome_reset',
          role: 'ai',
          text: 'কথোপকথন রিসেট করা হয়েছে। তোমার নতুন ট্রেডিং প্রশ্ন বা চার্ট শেয়ার করো!',
          timestamp: Date.now(),
        },
      ]);
      localStorage.removeItem('trade_gate_durjoy_ai_history');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-2 sm:px-4 py-2">
      {/* Header Banner */}
      <div className="rounded-xl border border-[#3B82F6]/30 bg-gradient-to-r from-[#0D1426] via-[#121B33] to-[#0D1426] p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-mono text-base sm:text-lg font-bold text-white tracking-tight">
                Durjoy AI
              </h2>
              <span className="rounded bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                EDUCATIONAL ASSISTANT
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Trading &amp; Learning Assistant &bull; Bangla, English &amp; Banglish &bull; Vision Capable
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* TTS Audio toggle */}
          <button
            id="btn-toggle-tts"
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              soundEngine.play('button_click');
            }}
            title={ttsEnabled ? 'Voice Responses Enabled' : 'Voice Responses Muted'}
            className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors ${
              ttsEnabled
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                : 'border-[#2A2D35] bg-[#0F1115] text-gray-500'
            }`}
          >
            {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{ttsEnabled ? 'TTS ON' : 'TTS OFF'}</span>
          </button>

          {/* Clear History */}
          <button
            id="btn-clear-ai-history"
            onClick={handleClearHistory}
            className="flex items-center space-x-1 rounded-lg border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1.5 font-mono text-xs text-gray-400 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Educational Guard Banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300/90 flex items-start space-x-2">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-300">DISCIPLINE MANDATE:</strong> Durjoy AI শিক্ষামূলক বিশ্লেষণের জন্য প্রস্তুত। এটি স্বয়ংক্রিয় সিগন্যাল প্রদান করে না এবং Trade Gate আনলক করতে পারে না। প্রতিটি ট্রেড এক্সিকিউশনের পূর্বে তোমাকে নিজ দায়িত্বে চেকলিস্ট পূরণ করতে হবে।
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        ref={chatContainerRef}
        className="rounded-xl border border-[#2A2D35] bg-[#0A0F1D] p-4 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-800"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                  : msg.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-bl-none'
                  : 'bg-[#121829] border border-[#2A344E] text-gray-200 rounded-bl-none'
              }`}
            >
              {/* If attached image */}
              {msg.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-lg border border-white/20 bg-black/40 max-h-48">
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded Chart"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}

              {/* Message text formatted with line breaks */}
              <div className="whitespace-pre-wrap select-text font-normal">{msg.text}</div>

              {/* Action buttons for AI response */}
              {msg.role === 'ai' && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-mono text-[10px] text-blue-300">Durjoy AI &bull; Educational</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="hover:text-white flex items-center space-x-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                    {onInsertEducationalNote && (
                      <button
                        onClick={() => {
                          onInsertEducationalNote(msg.text);
                          soundEngine.play('data_saved');
                        }}
                        className="hover:text-blue-300 flex items-center space-x-1"
                        title="Save to session notes"
                      >
                        <span className="text-[10px]">Save to Notes</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="mt-1 text-[9px] font-mono text-gray-500 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-2">
            <div className="rounded-2xl bg-[#121829] border border-[#2A344E] p-3 text-xs text-blue-300 flex items-center space-x-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span>Durjoy AI বিশ্লেষণ করছে...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundEngine.play('button_click');
              setInputText(chip.prompt);
            }}
            className="rounded-full border border-[#2A2D35] bg-[#0D1426] px-3 py-1 font-mono text-[11px] text-gray-300 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Image Preview if selected */}
      {selectedImage && (
        <div className="flex items-center justify-between rounded-lg border border-blue-500/40 bg-blue-500/10 p-2.5">
          <div className="flex items-center space-x-3">
            <img
              src={selectedImage.previewUrl}
              alt="Preview"
              className="h-12 w-16 object-cover rounded border border-blue-400/40"
            />
            <div>
              <span className="text-xs font-bold text-white block">{selectedImage.file.name}</span>
              <span className="text-[10px] text-blue-300 font-mono">
                {(selectedImage.file.size / 1024).toFixed(1)} KB &bull; Ready for Gemini Vision Analysis
              </span>
            </div>
          </div>
          <button
            onClick={handleClearImage}
            className="rounded-lg p-1.5 text-gray-400 hover:text-rose-400 transition-colors"
            title="Remove screenshot"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Chat Input & Controls Bar */}
      <div className="rounded-xl border border-[#2A2D35] bg-[#0D1426] p-2 sm:p-3 shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleImageSelect}
            className="hidden"
            id="durjoy-ai-image-input"
          />

          {/* Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Chart Screenshot (TradingView, Journal, Setup)"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border border-[#2A2D35] bg-[#121829] text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
          </button>

          {/* Voice Mic Button */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              title={
                voiceState === 'LISTENING'
                  ? 'Listening... Tap to stop'
                  : 'Voice input (Bangla / English)'
              }
              className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border transition-all ${
                voiceState === 'LISTENING'
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'border-[#2A2D35] bg-[#121829] text-gray-300 hover:border-violet-500 hover:text-violet-400'
              }`}
            >
              {voiceState === 'LISTENING' ? (
                <Mic className="h-4 w-4 text-rose-400" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              id="durjoy-ai-text-input"
              type="text"
              placeholder={
                selectedImage
                  ? 'Optional prompt: e.g. "Identify FVG & MSS in this chart"...'
                  : 'Ask about trading terminology, sessions, RRR, or FVG...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
              className="w-full rounded-lg border border-[#2A2D35] bg-[#090D18] px-3 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Send Button */}
          <button
            id="btn-durjoy-ai-send"
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || (!inputText.trim() && !selectedImage)}
            className="flex h-9 sm:h-10 items-center space-x-1.5 rounded-lg bg-blue-600 px-3 sm:px-4 font-mono text-xs font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Voice status indicator */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-500 font-mono px-1">
          <div className="flex items-center space-x-2">
            <span>VOICE STATUS:</span>
            <span
              className={`font-bold ${
                voiceState === 'LISTENING'
                  ? 'text-rose-400 animate-pulse'
                  : voiceState === 'SPEAKING'
                  ? 'text-cyan-400'
                  : voiceState === 'THINKING'
                  ? 'text-amber-400'
                  : 'text-gray-400'
              }`}
            >
              {voiceState}
            </span>
          </div>

          {isSpeechSupported && (
            <div className="flex items-center space-x-2">
              <span>VOICE LANG:</span>
              <button
                type="button"
                onClick={() => {
                  setVoiceLang(voiceLang === 'bn-BD' ? 'en-US' : 'bn-BD');
                  soundEngine.play('button_click');
                }}
                className="text-blue-400 hover:underline"
              >
                {voiceLang === 'bn-BD' ? 'বাংলা (bn-BD)' : 'English (en-US)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
