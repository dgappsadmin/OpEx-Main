import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassmorphLoaderProps {
  message?: string;
  submessage?: string;
  show: boolean;
}

export default function GlassmorphLoader({ 
  message = "Authenticating", 
  submessage = "Please wait while we verify your credentials...", 
  show 
}: GlassmorphLoaderProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Glassmorphism Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/30 to-blue-100/40 backdrop-blur-md"></div>
      
      {/* Background Chemical Effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-blue-200/20 rounded-full blur-lg animate-float-molecule"></div>
        <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-blue-300/15 rounded-full blur-lg animate-float-molecule-delayed"></div>
        <div className="absolute bottom-1/4 left-1/2 w-10 h-10 bg-blue-100/25 rounded-full blur-lg animate-float-molecule-slow"></div>
        
        {/* Floating bonds */}
        <div className="absolute top-1/3 left-1/4 w-20 h-0.5 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent rotate-45 animate-pulse-bond"></div>
        <div className="absolute bottom-1/3 right-1/4 w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-200/25 to-transparent -rotate-12 animate-pulse-bond-delayed"></div>
      </div>

      {/* Main Loader Card */}
      <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl border border-white/60 rounded-2xl p-8 max-w-sm mx-4 animate-fade-in">
        {/* Glassmorphism border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-blue-50/30 pointer-events-none"></div>
        
        <div className="relative z-10 text-center space-y-6">
          {/* Animated Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-16 h-16 border-4 border-blue-200/40 border-t-blue-500 rounded-full animate-spin"></div>
              
              {/* Inner content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="w-5 h-5 text-white animate-spin" style={{ animationDirection: 'reverse' }} />
                </div>
              </div>
              
              {/* Pulsing rings */}
              <div className="absolute inset-0 w-16 h-16 border-2 border-blue-300/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 w-12 h-12 border border-blue-400/20 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Message Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
              {message}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {submessage}
            </p>
          </div>

          {/* Animated Progress Dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>

          {/* Subtle bottom decoration */}
          <div className="pt-2">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}