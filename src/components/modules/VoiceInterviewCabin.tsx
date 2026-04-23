import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Activity, Loader2, StopCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export const VoiceInterviewCabin: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'ai', text: '你好，极客。我是你的 AI 模拟面试官。你可以向我介绍一下你最近做的项目，或者直接让我考考你。' }
  ]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // 🚨 新增：备用文本输入框状态
  const [inputText, setInputText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; 
        recognitionRef.current.interimResults = true; 
        recognitionRef.current.lang = 'zh-CN';

        recognitionRef.current.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullText += event.results[i][0].transcript;
          }
          setCurrentTranscript(fullText);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('语音引擎报错:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('❌ 麦克风权限被拒绝，请检查浏览器设置。');
          } else if (event.error === 'network') {
            toast.error('❌ Chrome 语音服务受限，建议使用 Edge 浏览器，或使用下方键盘输入。', { duration: 5000 });
          } else if (event.error !== 'no-speech') {
            toast.error(`⚠️ 麦克风异常: ${event.error}`);
          }
        };
      }
    }
    
    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current && isListening) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!isListening && currentTranscript.trim()) {
      handleSend(currentTranscript);
      setCurrentTranscript('');
    }
  }, [isListening, currentTranscript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('❌ 浏览器不支持，请使用 Edge 或新版 Chrome。');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthRef.current) synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('启动麦克风失败:', e);
        setIsListening(false);
      }
    }
  };

  // 🚨 新增：处理键盘直接提交文本
  const handleTextSubmit = () => {
    if (!inputText.trim() || isProcessing) return;
    const textToSend = inputText;
    setInputText('');
    handleSend(textToSend);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text }]);
    setIsProcessing(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '' }]);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'analyze', 
          content: text + ' (请用简短口语化的语言回答，像真实的面试官一样，控制在50字以内，纯文本不要Markdown)', 
          intent: 'execute' 
        }),
      });

      if (!response.ok) throw new Error('网络请求失败');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.replace('data: ', '').trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const contentChunk = data.choices?.[0]?.delta?.content || '';
              fullText += contentChunk;
              
              setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId ? { ...msg, text: fullText } : msg
              ));
            } catch (e) {}
          }
        }
      }

      speakText(fullText);

    } catch (error) {
      toast.error('AI 响应失败，请检查后端服务');
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, text: '抱歉，我的网络连接有点故障，请再试一次。' } : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); 
    
    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05; 
    utterance.pitch = 1.1; 
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const forceStop = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    setIsSpeaking(false);
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex flex-col items-center font-sans"
        >
          <button 
            onClick={() => { forceStop(); onClose(); }}
            className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute top-12 flex flex-col items-center">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 font-black text-sm tracking-widest uppercase">
               <Activity className="w-4 h-4" /> AI 面试舱已激活
             </div>
          </div>

          {/* 实时对话文字上屏区 (高度调整，给底部留空间) */}
          <div ref={scrollRef} className="w-full max-w-4xl h-[55vh] mt-28 mb-4 overflow-y-auto custom-scrollbar p-6 space-y-8">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-[11px] font-black uppercase tracking-wider mb-2 ${msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {msg.role === 'user' ? '极客 (You)' : 'AI 考官 (Interviewer)'}
                </span>
                <div className={`px-6 py-4 rounded-3xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' : 'bg-zinc-800 border border-zinc-700 text-gray-200 rounded-tl-sm shadow-xl'}`}>
                  <p className="text-lg sm:text-xl font-bold leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                    {msg.role === 'ai' && isProcessing && msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-2 h-5 ml-1 bg-emerald-500 animate-pulse align-middle"></span>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {currentTranscript && (
               <div className="flex flex-col items-end opacity-90">
                 <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                   <Loader2 className="w-3 h-3 animate-spin" /> 听写中...
                 </span>
                 <div className="px-6 py-4 rounded-3xl bg-blue-600/30 border border-blue-500/50 text-white rounded-tr-sm max-w-[85%]">
                   <p className="text-lg sm:text-xl font-bold leading-relaxed italic">{currentTranscript}</p>
                 </div>
               </div>
            )}
          </div>

          {/* 麦克风核心交互区 */}
          <div className="relative flex flex-col items-center justify-center mt-auto mb-6">
            <div className="relative flex items-center justify-center h-32 w-32 mb-4">
              {(isListening || isSpeaking) && (
                <>
                  {/* 🚨 修复光环遮挡：加入了 pointer-events-none */}
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 rounded-full blur-xl pointer-events-none ${isSpeaking ? 'bg-emerald-500/30' : 'bg-blue-500/30'}`} />
                  <motion.div animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, delay: 0.5, repeat: Infinity }} className={`absolute inset-0 rounded-full blur-2xl pointer-events-none ${isSpeaking ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`} />
                </>
              )}

              <button
                onClick={toggleListening}
                disabled={isProcessing}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  isProcessing ? 'bg-gray-600 cursor-not-allowed' : 
                  isListening ? 'bg-rose-500 hover:bg-rose-600 scale-110 shadow-[0_0_40px_rgba(244,63,94,0.6)]' : 
                  'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
                }`}
              >
                {isListening ? <StopCircle className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
              </button>
            </div>
            
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">
              {isProcessing ? 'AI 正在思考...' : isListening ? '🔵 正在聆听... (说完请再次点击停止)' : isSpeaking ? '🟢 AI 正在讲话... (点击打断并说话)' : '点击麦克风，进行语音对话'}
            </p>
          </div>

          {/* 🚨 新增：赛博朋克风备用文本输入区 */}
          <div className="w-full max-w-2xl px-6 pb-12 mt-2">
            <div className="relative flex items-center bg-white/5 border-2 border-white/10 hover:border-blue-500/50 focus-within:border-blue-500 rounded-full p-2 transition-all">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                placeholder="麦克风连不上？直接在这里敲字回击考官..."
                disabled={isProcessing || isListening}
                className="flex-1 bg-transparent text-white font-bold px-6 outline-none placeholder:text-gray-500 disabled:opacity-50"
              />
              <button 
                onClick={handleTextSubmit}
                disabled={!inputText.trim() || isProcessing || isListening}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};