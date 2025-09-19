import React from "react";
import { doctorAgent } from "./DoctorAgentCard";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";

type doctorAgentCardProps = {
  doctor: doctorAgent;
  setSelectedDoctor: (doctor: doctorAgent) => void;
  selectedDoctor: doctorAgent | null;
};

function SuggestedDocterCard({
  doctor,
  setSelectedDoctor,
  selectedDoctor,
}: doctorAgentCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-between border rounded-2xl shadow p-5 hover:border-blue-500 transition-all duration-300 ${selectedDoctor?.id === doctor.id ? "border-blue-500" : ""}`}
      onClick={() => {
        setSelectedDoctor(doctor);
      }}
    >
      {doctor.image && (
        <Image
          src={doctor.image}
          alt={doctor.specialist}
          width={70}
          height={70}
          className="w-[50px] h-[50px] object-cover rounded-4xl bg-[#929aa3]"
        />
      )}
      <h3 className="font-bold mt-1">{doctor.specialist}</h3>
      <p className="text-sm line-clamp-2 text-gray-500">{doctor.description}</p>
    </div>
  );
}

export default SuggestedDocterCard;
