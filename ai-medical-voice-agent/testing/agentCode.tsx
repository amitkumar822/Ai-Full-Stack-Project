"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios"
import { Circle, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { doctorAgent } from "@/app/(routes)/dashboard/_components/DoctorAgentCard";

type SessionDetailsType = {
  id: string;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdOn: string;
};

type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsType>();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    GetSessionDetails();
    
    // Initialize VAPI instance only once
    if (!vapiRef.current && process.env.NEXT_PUBLIC_VAPI_API_KEY) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);
      
      // Set up event listeners only once
      vapiRef.current.on("call-start", () => {
        console.log("Call started");
        setIsCallActive(true);
        setIsConnecting(false);
        setCallDuration(0);
        setTranscripts([]);
      });
      
      vapiRef.current.on("call-end", () => {
        console.log("Call ended");
        setIsCallActive(false);
        setIsConnecting(false);
        setIsAgentSpeaking(false);
        setIsUserSpeaking(false);
      });
      
      vapiRef.current.on("error", (error) => {
        console.error("VAPI Error:", error);
        
        // Handle different types of errors
        if (error.type === "ejected" || error.msg === "Meeting has ended") {
          console.log("Meeting ended normally or was ejected");
          setIsCallActive(false);
          setIsConnecting(false);
          setIsAgentSpeaking(false);
          setIsUserSpeaking(false);
          setErrorMessage(null);
          
          // Clean up audio resources
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          if (microphoneRef.current) {
            microphoneRef.current.disconnect();
            microphoneRef.current = null;
          }
        } else {
          // Handle other errors
          console.error("VAPI Error details:", error);
          setIsCallActive(false);
          setIsConnecting(false);
          setIsAgentSpeaking(false);
          setIsUserSpeaking(false);
          
          // Set error message for user feedback
          setErrorMessage(error.msg || "An error occurred during the call");
          
          // Auto-retry for certain errors (max 3 times)
          if (retryCount < 3 && (error.type === "network" || error.type === "timeout")) {
            setRetryCount(prev => prev + 1);
            retryTimeoutRef.current = setTimeout(() => {
              console.log(`Retrying call attempt ${retryCount + 1}`);
              startCall();
            }, 2000 * (retryCount + 1)); // Exponential backoff
          }
        }
      });
      
      vapiRef.current.on("message", (message) => {
        if (message.type === "transcript") {
          console.log(`${message.role}: ${message.transcript}`);
          
          // Add transcript to state with unique ID
          const newMessage: TranscriptMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: message.role === 'user' ? 'user' : 'assistant',
            text: message.transcript,
            timestamp: new Date()
          };
          
          setTranscripts(prev => [...prev, newMessage]);
          
          // Set speaking states
          if (message.role === 'assistant') {
            setIsAgentSpeaking(true);
            setTimeout(() => setIsAgentSpeaking(false), 2000);
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
      }
    };
  }, [sessionId]);

  // Timer effect
  useEffect(() => {
    if (isCallActive) {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCallActive]);

  // Auto-scroll transcript effect
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  const GetSessionDetails = async () => {
    try {
      const response = await axios.get(
        `/api/session-chart?sessionId=${sessionId}`
      );
      console.log(response.data);
      setSessionDetails(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    if (!vapiRef.current || !process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID) {
      console.error("VAPI not initialized or missing voice assistant ID");
      setErrorMessage("VAPI not properly configured");
      return;
    }

    try {
      setIsConnecting(true);
      setErrorMessage(null);
      
      // Clean up any existing audio resources first
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }
      
      // Initialize audio context for voice detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      // Start voice activity detection
      detectVoiceActivity();
      
      // Start VAPI call
      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID);
    } catch (error) {
      console.error("Error starting call:", error);
      setIsConnecting(false);
      setIsCallActive(false);
      setErrorMessage("Failed to start call. Please try again.");
      
      // Clean up on error
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }
    }
  };

  const endCall = async () => {
    try {
      if (vapiRef.current) {
        await vapiRef.current.stop();
      }
    } catch (error) {
      console.error("Error ending call:", error);
    } finally {
      // Always clean up state and resources
      setIsCallActive(false);
      setIsConnecting(false);
      setIsAgentSpeaking(false);
      setIsUserSpeaking(false);
      
      // Clean up audio resources
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (microphoneRef.current) {
        microphoneRef.current.disconnect();
        microphoneRef.current = null;
      }
    }
  };

  const detectVoiceActivity = () => {
    if (!analyserRef.current || !isCallActive) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVoice = () => {
      if (!analyserRef.current || !isCallActive) return;
      
      try {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Threshold for voice detection
        if (average > 20) {
          setIsUserSpeaking(true);
        } else {
          setIsUserSpeaking(false);
        }
        
        if (isCallActive) {
          requestAnimationFrame(checkVoice);
        }
      } catch (error) {
        console.error("Error in voice detection:", error);
        setIsUserSpeaking(false);
      }
    };
    
    checkVoice();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality with VAPI
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // TODO: Implement actual speaker toggle functionality
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className={`relative p-2 px-4 border-2 rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm transition-all duration-300 ${
            isCallActive ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/25" :
            isConnecting ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/25" :
            "bg-slate-500/20 border-slate-400 text-slate-300"
          }`}>
            <div className="relative">
              <Circle 
                width={16} 
                height={16} 
                className={`${
                  isCallActive ? "fill-emerald-400" :
                  isConnecting ? "fill-amber-400 animate-pulse" :
                  "fill-slate-400"
                }`} 
              />
              {isCallActive && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
              )}
            </div>
            <span className="font-semibold text-sm">
              {isConnecting ? "Connecting..." : isCallActive ? "Call Active" : "Ready to Start"}
            </span>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2">
            <h2 className="font-mono text-lg font-bold text-white">
              {formatTime(callDuration)}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Profiles Row - Compact */}
        <div className="flex justify-center items-center gap-8 p-4 border-b border-slate-700/50">
          {/* AI Agent Profile */}
          <div className="flex items-center gap-4 group">
            <div className="relative">
              {/* Outer Glow Ring */}
              <div className={`absolute -inset-2 rounded-full transition-all duration-500 ${
                isAgentSpeaking 
                  ? "bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-75 blur-lg scale-110" 
                  : "bg-slate-600 opacity-30"
              }`}></div>
              
              {/* Profile Container */}
              <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-500 ${
                isAgentSpeaking 
                  ? "border-blue-400 shadow-lg shadow-blue-500/50 scale-105" 
                  : "border-slate-400 group-hover:border-blue-300"
              }`}>
                {sessionDetails?.selectedDoctor?.image ? (
                  <Image
                    src={sessionDetails.selectedDoctor.image}
                    alt={sessionDetails.selectedDoctor.specialist}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {sessionDetails?.selectedDoctor?.specialist?.charAt(0) || "AI"}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Speaking Indicator */}
              {isAgentSpeaking && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">
                {sessionDetails?.selectedDoctor?.specialist || "AI Medical Agent"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  isAgentSpeaking ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}></div>
                <span className="text-xs text-slate-300">
                  {isAgentSpeaking ? "Speaking..." : "Listening"}
                </span>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="text-slate-400 text-2xl font-bold">VS</div>

          {/* User Profile */}
          <div className="flex items-center gap-4 group">
            <div className="relative">
              {/* Outer Glow Ring */}
              <div className={`absolute -inset-2 rounded-full transition-all duration-500 ${
                isUserSpeaking 
                  ? "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 opacity-75 blur-lg scale-110" 
                  : "bg-slate-600 opacity-30"
              }`}></div>
              
              {/* Profile Container */}
              <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-500 ${
                isUserSpeaking 
                  ? "border-emerald-400 shadow-lg shadow-emerald-500/50 scale-105" 
                  : "border-slate-400 group-hover:border-emerald-300"
              }`}>
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">U</span>
                </div>
              </div>
              
              {/* Speaking Indicator */}
              {isUserSpeaking && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">You</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  isUserSpeaking ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}></div>
                <span className="text-xs text-slate-300">
                  {isUserSpeaking ? "Speaking..." : "Listening"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call Controls - Compact */}
        <div className="flex justify-center items-center gap-4 p-4 border-b border-slate-700/50">
          {/* Mute Button */}
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              isMuted 
                ? "bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30 shadow-lg shadow-red-500/25" 
                : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500"
            }`}
            disabled={!isCallActive}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>

          {/* Speaker Button */}
          <Button
            onClick={toggleSpeaker}
            variant={isSpeakerOn ? "default" : "outline"}
            size="sm"
            className={`w-12 h-12 rounded-full border-2 transition-all duration-300 ${
              isSpeakerOn 
                ? "bg-blue-500/20 border-blue-400 text-blue-300 hover:bg-blue-500/30 shadow-lg shadow-blue-500/25" 
                : "bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500"
            }`}
            disabled={!isCallActive}
          >
            {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </Button>

          {/* Call Control Button */}
          {!isCallActive && !isConnecting ? (
            <Button
              onClick={startCall}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-2xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              disabled={!process.env.NEXT_PUBLIC_VAPI_API_KEY || !process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID}
            >
              <PhoneCall size={24} />
            </Button>
          ) : isConnecting ? (
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xl shadow-amber-500/25"
              disabled
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </Button>
          ) : (
            <Button
              onClick={endCall}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-2xl shadow-red-500/25 transition-all duration-300 hover:scale-105"
            >
              <PhoneOff size={24} />
            </Button>
          )}
        </div>

        {/* Full Screen Transcript Display */}
        <div className="flex-1 flex flex-col p-4">
          {isCallActive ? (
            <div className="flex-1 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col">
              {/* Transcript Header */}
              <div className="flex items-center justify-center gap-3 p-4 border-b border-slate-700/50">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-white">Live Conversation</h3>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Transcript Content - Full Height */}
              <div 
                ref={transcriptRef}
                className="flex-1 overflow-y-auto space-y-4 p-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#475569 #1e293b'
                }}
              >
                {transcripts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-400">
                      <div className="animate-pulse text-xl mb-2">Waiting for conversation to start...</div>
                      <div className="text-sm opacity-70">Speak naturally to begin the consultation</div>
                    </div>
                  </div>
                ) : (
                  transcripts.map((message, index) => {
                    const opacity = Math.max(0.5, 1 - (transcripts.length - index - 1) * 0.05);
                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-300`}
                        style={{ opacity }}
                      >
                        <div className={`max-w-md lg:max-w-2xl px-6 py-4 rounded-2xl shadow-lg ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                            : 'bg-slate-700/80 backdrop-blur-sm border border-slate-600 text-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              message.role === 'user' ? 'bg-white' : 'bg-emerald-400'
                            }`}></div>
                            <div className="text-sm font-medium opacity-80">
                              {message.role === 'user' ? 'You' : sessionDetails?.selectedDoctor?.specialist || 'Doctor'}
                            </div>
                            <div className="text-xs opacity-60 ml-auto">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-base leading-relaxed">{message.text}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-2xl mb-4">Start a conversation to see the transcript</div>
                <div className="text-sm opacity-70">Click the call button to begin your consultation</div>
              </div>
            </div>
          )}
        </div>

        {/* Call Status Messages - Compact */}
        <div className="p-4">
          {errorMessage && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-red-300 text-sm font-medium">
                Error: {errorMessage}
              </p>
              <p className="text-red-400 text-xs mt-1">
                {retryCount > 0 ? `Retry attempt ${retryCount}/3` : "Please try again"}
              </p>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setRetryCount(0);
                  startCall();
                }}
                className="mt-2 px-3 py-1 bg-red-500/20 border border-red-400 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors text-xs"
              >
                Retry Call
              </button>
            </div>
          )}
          
          {!isCallActive && !isConnecting && !errorMessage && (
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-slate-300 text-sm font-medium">
                Click the green phone button to start your consultation
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Your AI medical assistant is ready to help
              </p>
            </div>
          )}
          {isConnecting && (
            <div className="bg-amber-500/20 backdrop-blur-sm border border-amber-400 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-amber-300 text-sm font-medium">
                Connecting to AI medical assistant...
              </p>
              <p className="text-amber-400 text-xs mt-1">
                Please wait while we establish the connection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicalVoiceAgent;
