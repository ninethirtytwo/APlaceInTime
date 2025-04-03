"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define message structure
interface Message {
  sender: 'user' | 'vinn';
  text: string;
}

// Define message structure for API history
interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}


const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = React.useState<Message[]>([
    { sender: 'vinn', text: "Hey! I'm Vinn, your AI creative partner. How can I help you today?" }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<null | HTMLDivElement>(null); // Ref for scrolling

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    // Add user message immediately for responsiveness
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    // --- Backend API Call ---
    try {
      // Prepare history in the format Claude expects ('user'/'assistant')
      // Exclude the initial greeting message from history sent to API if desired
      const historyPayload: ApiChatMessage[] = currentMessages
        .slice(1) // Optionally remove the first greeting message
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, history: historyPayload }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get response from Vinn.');
      }

      const botResponse: Message = { sender: 'vinn', text: data.reply || "Sorry, I couldn't think of anything." };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
       console.error("Chat API error:", error);
       const errorResponse: Message = { sender: 'vinn', text: error instanceof Error ? error.message : "Sorry, something went wrong." };
       setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
    // --- End Backend API Call ---
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline on Enter
      handleSend();
    }
  };

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-5 right-5 sm:bottom-auto sm:top-20 sm:left-5 z-50 w-[90vw] max-w-md h-[70vh] sm:h-[60vh] bg-black/70 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/vinn.png" alt="Vinn Avatar" width={24} height={24} className="rounded-full" />
              <h3 className="text-md font-semibold text-white">Vinn Assistant</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"> {/* Added scrollbar styling */}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/80 text-white'
                    : 'bg-gray-700/60 text-gray-200'
                }`}>
                  {/* Basic text display for now */}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="max-w-[80%] p-3 rounded-lg text-sm bg-gray-700/60 text-gray-400 italic">
                    Vinn is thinking...
                 </div>
               </div>
            )}
             {/* Empty div to scroll to */}
             <div ref={messagesEndRef} />
          </div> {/* Close Message List div */}

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-black/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Vinn anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow p-2 rounded bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-100"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                className="p-2 rounded bg-purple-600/80 hover:bg-purple-500/80 text-white disabled:opacity-50"
                disabled={isLoading || !input.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; // Closing component function

export default Chatbot;