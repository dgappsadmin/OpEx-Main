// import React, { useState } from 'react';
// import { MessageCircle, X } from 'lucide-react';
// import ChatWindow from './ChatWindow';

// export default function FloatingChatButton() {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       {/* Floating Chat Button - Slightly Smaller for Laptop Screens */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="fixed bottom-5 right-5 z-50 group"
//           data-testid="floating-chat-button"
//         >
//           <div className="relative">
//             {/* Glow effect */}
//             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 animate-glow transition-opacity duration-300"></div>
            
//             {/* Button - Slightly Smaller */}
//             <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-110">
//               <MessageCircle className="w-6 h-6 text-white animate-bounce-slow" />
              
//               {/* Notification dot */}
//               <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
//             </div>
//           </div>
//         </button>
//       )}

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="fixed bottom-5 right-5 z-50 animate-chat-entrance">
//           <ChatWindow onClose={() => setIsOpen(false)} />
//         </div>
//       )}
//     </>
//   );
// }
