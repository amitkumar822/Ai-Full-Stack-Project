import { Button } from '@/components/ui/button';
import { IconArrowRight } from '@tabler/icons-react';
import Image from 'next/image';
import React from 'react'

export type doctorAgent = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
}
type doctorAgentCardProps = {
    doctor: doctorAgent;
}


function DoctorAgentCard({ doctor }: doctorAgentCardProps) {
  return (
    <div>
        <Image src={doctor.image} alt={doctor.specialist} width={200} height={150}
        className='w-full h-[250px] object-cover rounded-xl bg-[#929aa3]'
        />
        <h3 className='font-bold mt-1'>{doctor.specialist}</h3>
        <p className='text-sm line-clamp-2 text-gray-500'>{doctor.description}</p>
        <Button className='w-full mt-2'>Start Consultation <IconArrowRight /> </Button>
    </div>
  )
}

export default DoctorAgentCard