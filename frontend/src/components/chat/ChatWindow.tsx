// import React, { useState, useRef, useEffect } from 'react';
// import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
// import axios from 'axios';

// interface Message {
//   role: 'user' | 'assistant';
//   content: string;
//   timestamp: Date;
// }

// interface ChatWindowProps {
//   onClose: () => void;
// }

// // Function to get API base URL (same as in api.ts)
// const getApiBaseUrl = (): string => {
//   const hostname = window.location.hostname;
  
//   if (hostname === 'localhost' || hostname === '127.0.0.1') {
//     return 'http://localhost:9090/opexhub/api';
//   } else if (hostname === 'dgapps.godeepak.com') {
//     return 'https://dgapps.godeepak.com/opexhub/api';
//   } else if (hostname === 'dgpilotapps.godeepak.com') {
//     return 'https://dgpilotapps.godeepak.com/opexhub/api';
//   } else {
//     return 'http://localhost:9090/opexhub/api';
//   }
// };

// export default function ChatWindow({ onClose }: ChatWindowProps) {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       role: 'assistant',
//       content: '👋 Hello! I\'m your OpEx Hub AI Assistant. I can help you with questions about your initiatives, users, sites, and operational data. Try asking me:\n\n• "How many initiatives are in NDS site?"\n• "What is the total expected savings?"\n• "Show me initiatives by status"',
//       timestamp: new Date()
//     }
//   ]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     inputRef.current?.focus();
//   }, []);

//   const handleSend = async () => {
//     if (!input.trim() || isLoading) return;

//     const userMessage: Message = {
//       role: 'user',
//       content: input,
//       timestamp: new Date()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     const userInput = input;
//     setInput('');
//     setIsLoading(true);

//     try {
//       const backendUrl = getApiBaseUrl();
//       const token = localStorage.getItem('opex_token');

//       console.log('🤖 Chat API Request:', {
//         url: `${backendUrl}/chat/ask`,
//         message: userInput,
//         hasToken: !!token
//       });

//       const response = await axios.post(
//         `${backendUrl}/chat/ask`,
//         { message: userInput },
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       console.log('🤖 Chat API Response:', response.data);

//       const assistantMessage: Message = {
//         role: 'assistant',
//         content: response.data.response,
//         timestamp: new Date()
//       };

//       setMessages(prev => [...prev, assistantMessage]);
//     } catch (error: any) {
//       console.error('❌ Error sending message:', error);
//       console.error('Error details:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });
      
//       const errorMessage: Message = {
//         role: 'assistant',
//         content: '⚠️ Sorry, I encountered an error. Please try again or contact support if the issue persists.',
//         timestamp: new Date()
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   return (
//     <div className="w-[340px] h-[500px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
//       {/* Header - Compact */}
//       <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-3 flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center animate-pulse-slow">
//               <Sparkles className="w-4 h-4 text-purple-600" />
//             </div>
//             <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
//           </div>
//           <div>
//             <h3 className="text-white font-bold text-sm">OpEx Hub AI</h3>
//             <p className="text-blue-100 text-[10px]">Your Data Assistant</p>
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors duration-200"
//           data-testid="close-chat-button"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>

//       {/* Messages - Scrollable */}
//       <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-gray-50 to-white">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-message-in`}
//           >
//             {/* Avatar - Smaller */}
//             <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
//               message.role === 'assistant' 
//                 ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
//                 : 'bg-gradient-to-br from-gray-400 to-gray-600'
//             }`}>
//               {message.role === 'assistant' ? (
//                 <Bot className="w-4 h-4 text-white" />
//               ) : (
//                 <User className="w-4 h-4 text-white" />
//               )}
//             </div>

//             {/* Message bubble - Compact */}
//             <div className={`max-w-[75%] ${
//               message.role === 'user' 
//                 ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
//                 : 'bg-white border border-gray-200 text-gray-800'
//             } rounded-xl p-2 shadow-sm`}>
//               <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
//               <p className={`text-[10px] mt-1 ${
//                 message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
//               }`}>
//                 {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//               </p>
//             </div>
//           </div>
//         ))}

//         {/* Loading indicator - Compact */}
//         {isLoading && (
//           <div className="flex gap-2 animate-message-in">
//             <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
//               <Bot className="w-4 h-4 text-white" />
//             </div>
//             <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
//               <div className="flex items-center gap-2">
//                 <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
//                 <span className="text-xs text-gray-600">Analyzing...</span>
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input - Compact */}
//       <div className="p-3 border-t border-gray-200 bg-white">
//         <div className="flex gap-2">
//           <input
//             ref={inputRef}
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Ask about your OpEx data..."
//             className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all duration-200 text-xs"
//             disabled={isLoading}
//             data-testid="chat-input"
//           />
//           <button
//             onClick={handleSend}
//             disabled={!input.trim() || isLoading}
//             className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
//             data-testid="send-button"
//           >
//             <Send className="w-4 h-4" />
//           </button>
//         </div>
//         <p className="text-[10px] text-gray-400 mt-1.5 text-center">
//           Ask me about initiatives, users, sites, and more!
//         </p>
//       </div>
//     </div>
//   );
// }
