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
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="ai-fab fixed bottom-8 right-8 w-16 h-16 bg-secondary rounded-full shadow-lg flex items-center justify-center text-3xl z-40 transition-all duration-300 transform hover:scale-110 hover:shadow-xl focus:outline-none"
                aria-label="Mở AI Chatbox"
            >
                {/* Bubbles container */}
                <div className="bubbles">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>
                
                {/* New SVG Icon */}
                <svg viewBox="0 0 100 100" width="44" height="44" className="isolate clip-circle">
                    <defs>
                        <linearGradient id="electricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00ffff" />
                            <stop offset="100%" stopColor="#0066ff" />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" className="face-fill" />
                    <path className="glow"
                    d="M50 5
                        A45 45 0 1 1 49.9 5
                        M30 35 Q50 20 70 35
                        M30 65 Q50 80 70 65" />
                    <g className="face-details">
                        <circle cx="35" cy="45" r="4" />
                        <circle cx="65" cy="45" r="4" />
                        <line x1="40" y1="63" x2="60" y2="63" />
                    </g>
                </svg>
            </button>

            {/* Chatbox Window */}
            {isOpen && (
                <div 
                    className="fixed bottom-28 right-8 w-[calc(100%-4rem)] max-w-md bg-secondary/80 backdrop-blur-lg border border-accent/50 rounded-lg shadow-2xl z-40 animate-fade-in-up flex flex-col" 
                    style={{ height: 'clamp(300px, 60vh, 600px)' }}>
                    <header className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
                        <h3 className="text-lg font-bold text-highlight flex items-center gap-2">
                            <i className="fas fa-magic"></i>
                            Trợ lý Tài chính AI
                        </h3>
                        <button className="text-text-secondary hover:text-text-primary text-2xl" aria-label="Đóng">&times;</button>
                    </header>
                    <div className="px-4 pb-4 flex-grow overflow-y-auto min-h-0">
                         {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary">
                                <i className="fas fa-spinner fa-spin text-highlight text-4xl"></i>
                                <p className="mt-4">AI đang phân tích dữ liệu của bạn...</p>
                                <p className="text-xs mt-1">Việc này có thể mất một vài giây.</p>
                            </div>
                        ) : aiError ? (
                             <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg h-full flex flex-col justify-center">
                                <p className="font-bold text-center">Đã có lỗi xảy ra!</p>
                                <p className="text-sm text-center mt-2">{aiError}</p>
                            </div>
                        ) : aiAdvice ? (
                             <div 
                                className="prose prose-invert prose-sm max-w-none text-text-primary whitespace-pre-wrap p-3 bg-primary/70 rounded-md"
                                dangerouslySetInnerHTML={{ __html: aiAdvice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}
                            />
                        ) : (
                            <div className="text-center text-text-secondary p-4 flex flex-col items-center justify-center h-full">
                                <i className="fas fa-magic text-4xl mb-4 text-highlight"></i>
                                <p>Nhận phân tích và lời khuyên tài chính được cá nhân hóa.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-accent/50">
                        <button
                            onClick={handleGetAiAdvice}
                            disabled={isAiLoading}
                            className="w-full bg-highlight text-primary font-bold py-2.5 px-4 rounded-md hover:bg-teal-400 transition duration-300 disabled:bg-accent disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAiLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Đang phân tích...</span>
                                </>
                            ): aiAdvice || aiError ? (
                                 'Tạo lại phân tích'
                            ) : (
                                'Cho tôi lời khuyên'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbox;