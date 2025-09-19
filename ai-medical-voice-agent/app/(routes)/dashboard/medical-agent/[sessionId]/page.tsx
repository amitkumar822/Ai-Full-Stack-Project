"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { doctorAgent } from "../../_components/DoctorAgentCard";
import { Circle, PhoneCall, PhoneOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Vapi from "@vapi-ai/web";

type SessionDetailsType = {
  id: string;
  notes: string;
  sessionId: string;
  report: JSON;
  selectedDoctor: doctorAgent;
  createdOn: string;
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
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);

  const startCall = async () => {
    vapi.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID);

    // Listen for events
    vapi.on("call-start", () => {
      console.log("Call started");
      setIsCallActive(true);
    });
    vapi.on("call-end", () => {
      console.log("Call ended");
      setIsCallActive(false);
    });
    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        console.log(`${message.role}: ${message.transcript}`);
      }
    });
  };

  const endCall = async () => {
    vapi.stop();
    setIsCallActive(false);
  };

  return (
    <div className="p-5 border rounded-3xl bg-secondary">
      <div className="flex justify-between items-center">
        <h2 className="p-1 px-2 border rounded-md flex items-center justify-center gap-2">
          <Circle width={16} height={16} className={isCallActive ? "text-green-500" : "text-red-500"} />{" "}
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

          <div className="mt-32">
            <h2 className="text-gray-400">Assigned Msg</h2>
            <h2 className="text-lg">User Msg</h2>
          </div>

          {!isCallActive ? (
            <Button className="cursor-pointer mt-5" onClick={startCall}>
              <PhoneCall /> Start Call
            </Button>
          ) : (
            <Button variant={'destructive'} className="cursor-pointer mt-5" onClick={endCall}>
              <PhoneOff />
              Disconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MedicalVoiceAgent;
