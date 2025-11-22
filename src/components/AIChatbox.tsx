import React, { useState } from 'react';

interface AIChatboxProps {
    handleGetAiAdvice: () => void;
    isAiLoading: boolean;
    aiAdvice: string;
    aiError: string | null;
}

const AIChatbox: React.FC<AIChatboxProps> = ({ handleGetAiAdvice, isAiLoading, aiAdvice, aiError }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button - 3D Robot Pulse Style */}
            <div 
                className="fixed bottom-6 right-6 z-50 group"
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="focus:outline-none bg-transparent border-none p-0"
                    aria-label="Mở AI Chatbox"
                >
                    <svg className="robot-pulse" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="robotG" cx="30%" cy="30%" r="80%">
                                <stop offset="0%" stopColor="#c6f2ff"/>
                                <stop offset="40%" stopColor="#7dc8ff"/>
                                <stop offset="100%" stopColor="#347dff"/>
                            </radialGradient>
                        </defs>

                        {/* Outer glow highlight */}
                        <circle cx="100" cy="100" r="78" fill="url(#robotG)" opacity="0.9"/>

                        {/* Robot Head */}
                        <rect x="45" y="50" width="110" height="85" rx="32" fill="url(#robotG)" />

                        {/* Robot Eyes */}
                        <rect x="68" y="65" width="65" height="40" rx="18" fill="#fff" opacity="0.8"/>
                        <circle cx="97" cy="83" r="8" fill="#2f6cff"/>
                        <circle cx="125" cy="83" r="8" fill="#2f6cff"/>

                        {/* Robot Mouth */}
                        <rect x="82" y="112" width="40" height="12" rx="6" fill="white" opacity="0.55"/>

                        {/* Gloss highlight */}
                        <ellipse cx="82" cy="60" rx="36" ry="16" fill="white" opacity="0.22"/>
                    </svg>
                </button>
            </div>

            {/* Chatbox Window */}
            {isOpen && (
                <div 
                    className="fixed bottom-44 right-8 w-[calc(100%-4rem)] max-w-md bg-secondary/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-2xl z-40 animate-fade-in-up flex flex-col overflow-hidden ring-1 ring-white/10" 
                    style={{ height: 'clamp(350px, 60vh, 550px)' }}>
                    
                    <header className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex justify-between items-center cursor-pointer border-b border-white/10" onClick={() => setIsOpen(false)}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_#60a5fa]"></div>
                            Trợ lý Robot AI
                        </h3>
                        <button className="text-blue-200 hover:text-white text-2xl transition-colors" aria-label="Đóng">&times;</button>
                    </header>

                    <div className="px-4 py-4 flex-grow overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent">
                         {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-blue-200/80">
                                <div className="relative w-16 h-16 mb-4">
                                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin"></div>
                                    <div className="absolute inset-2 rounded-full border-t-2 border-purple-400 animate-spin [animation-direction:reverse]"></div>
                                </div>
                                <p className="animate-pulse">Đang suy nghĩ...</p>
                            </div>
                        ) : aiError ? (
                             <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl h-full flex flex-col justify-center items-center text-center">
                                <i className="fas fa-exclamation-circle text-3xl mb-2 text-red-400"></i>
                                <p className="font-bold">Rất tiếc, có lỗi xảy ra!</p>
                                <p className="text-sm mt-2 opacity-80 whitespace-pre-wrap">{aiError}</p>
                            </div>
                        ) : aiAdvice ? (
                             <div 
                                className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner"
                                dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300">$1</strong>').replace(/\n/g, '<br />') }}
                            />
                        ) : (
                            <div className="text-center text-blue-200/60 p-4 flex flex-col items-center justify-center h-full space-y-4">
                                <div className="p-4 bg-blue-500/10 rounded-full">
                                    <i className="fas fa-robot text-4xl text-blue-400"></i>
                                </div>
                                <p>Xin chào! Tôi là trợ lý tài chính ảo của bạn.</p>
                                <p className="text-sm">Bấm nút bên dưới để tôi phân tích ví tiền của bạn nhé!</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gradient-to-t from-secondary to-transparent">
                        <button
                            onClick={handleGetAiAdvice}
                            disabled={isAiLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/10"
                        >
                            {isAiLoading ? (
                                <>
                                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></span>
                                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                </>
                            ): aiAdvice || aiError ? (
                                 <>
                                    <i className="fas fa-redo-alt"></i> Phân tích lại
                                 </>
                            ) : (
                                <>
                                    <i className="fas fa-magic"></i> Phân tích tài chính
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbox;