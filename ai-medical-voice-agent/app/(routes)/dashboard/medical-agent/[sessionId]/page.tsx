"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, Loader2, PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

type SessionDetailsType = {
  id: string;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdOn: string;
};

type messages = {
  role: string;
  text: string;
};

function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsType>();

  useEffect(() => {
    GetSessionDetails();
  }, [sessionId]);

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

  // VAPI Voice Assistant functionality
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vapiInstance, setvapiInstance] = useState<any>(null);
  const [currentRole, setcurrentRole] = useState<string | null>();
  const [liveTranscript, setLiveTranscript] = useState<string>();
  const [messages, setMessages] = useState<messages[]>([]);

  const startCall = async () => {
    setIsLoading(true);
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setvapiInstance(vapi);

    const VapiAgentConfig = {
      name: "AI Medical Doctor Voice Agent",
      firstMessage:
        "Hi there! I'm your AI Medical Assistant. I'm here to help you with your medical questions and concerns.",
      transcriber: {
        provider: "assembly-ai",
        language: "en",
      },
      voice: {
        provider: "playht",
        voiceId: sessionDetails?.selectedDoctor?.voiceId,
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: sessionDetails?.selectedDoctor?.agentPrompt,
          },
        ],
      },
    };

    // @ts-ignore
    vapi.start(VapiAgentConfig);

    // Listen for events
    vapi.on("call-start", () => {
      setIsLoading(true);
      console.log("Call started");
      setIsCallActive(true);
    });
    vapi.on("call-end", () => {
      setIsLoading(false);
      console.log("Call ended");
      setIsCallActive(false);
    });
    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        const { role, transcript, transcriptType } = message;
        console.log(`${message.role}: ${message.transcript}`);

        if (transcriptType === "partial") {
          setLiveTranscript(transcript);
          setcurrentRole(role);
        } else if (transcriptType === "final") {
          // Final transcript
          setMessages((prevMessages) => [
            ...prevMessages,
            { role, text: transcript },
          ]);
          setLiveTranscript("");
          setcurrentRole(null);
        }
      }
      setIsLoading(false);
    });

    vapi.on("speech-start", () => {
      setIsLoading(true);
      console.log("Assistant started speaking");
      setcurrentRole("assistant");
    });
    vapi.on("speech-end", () => {
      setIsLoading(false);
      console.log("Assistant stopped speaking");
      setcurrentRole("user");
    });
  };

  const endCall = async () => {
    setIsLoading(true);
    if (!vapiInstance) return;
    // stop the call
    vapiInstance.stop();
    // Optionally remove listeners (good for memory management)
    // vapiInstance.removeAllListeners();
    vapiInstance.off("call-start");
    vapiInstance.off("call-end");
    vapiInstance.off("message");

    // Clear the instance
    setvapiInstance(null);
    setIsCallActive(false);

    const result = await generateReport();

    setIsLoading(false);
  };

  const generateReport = async () => {
    try {
      const response = await axios.post("/api/generate-report", {
        messages: messages,
        sessionId: sessionId,
        sessionDetails: sessionDetails,
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      toast.error("Failed to generate report");
      return null;
    }
  };

  return (
    <div className="p-5 border rounded-3xl bg-secondary">
      <div className="flex justify-between items-center">
        <h2 className="p-1 px-2 border rounded-md flex items-center justify-center gap-2">
          <Circle
            width={16}
            height={16}
            className={isCallActive ? "text-green-500" : "text-red-500"}
          />{" "}
          {isCallActive ? "Completed" : "Not Completed"}
        </h2>
        <h2 className="font-bold text-xl text-gray-400">00:00:00</h2>
      </div>
      {sessionDetails && (
        <div className="flex items-center flex-col gap-2 mt-10">
          <Image
            src={sessionDetails?.selectedDoctor?.image}
            alt="Doctor Image"
            width={120}
            height={120}
            className="h-[100px] w-[100px] object-cover rounded-full"
          />
          <h2 className="mt-2 text-lg">
            {sessionDetails?.selectedDoctor?.specialist}
          </h2>
          <p className="text-sm text-gray-400">AI Medical Voice Agent</p>

          <div className="mt-10 overflow-y-auto flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-72">
            {messages.slice(-4).map((msg, index) => (
              <h2 key={index} className="text-lg text-gray-400 p-2">
                {msg.role} : {msg.text}
              </h2>
            ))}
            <h2 className="text-gray-400">Assigned Msg</h2>
            {liveTranscript && liveTranscript?.length > 0 && (
              <h2 className="text-lg">
                {currentRole} : {liveTranscript}
              </h2>
            )}
          </div>

          {!isCallActive ? (
            <Button
              className="cursor-pointer mt-5"
              onClick={startCall}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <PhoneCall />}{" "}
              Start Call
            </Button>
          ) : (
            <Button
              variant={"destructive"}
              className="cursor-pointer mt-5"
              disabled={isLoading}
              onClick={endCall}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <PhoneOff />}
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
