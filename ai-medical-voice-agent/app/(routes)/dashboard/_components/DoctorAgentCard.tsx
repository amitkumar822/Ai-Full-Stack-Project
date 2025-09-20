"use client"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconArrowRight } from '@tabler/icons-react';
import Image from 'next/image';
import React from 'react'
import { useAuth } from '@clerk/nextjs';

export type doctorAgent = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId?: string;
    subscriptionRequired: boolean;
}
type doctorAgentCardProps = {
    doctor: doctorAgent;
}


function DoctorAgentCard({ doctor }: doctorAgentCardProps) {
  const {has} = useAuth();
  const hasPremiumPlan = has?.({ plan: 'pro' })
  console.log(hasPremiumPlan)
  return (
    <div className='relative'>
      {doctor.subscriptionRequired && (
        <div className='absolute top-0 right-0 m-2'>
          <Badge>Premium</Badge>
        </div>
      )}
        <Image src={doctor.image} alt={doctor.specialist} width={200} height={150}
        className='w-full h-[250px] object-cover rounded-xl bg-[#929aa3]'
        />
        <h3 className='font-bold mt-1'>{doctor.specialist}</h3>
        <p className='text-sm line-clamp-2 text-gray-500'>{doctor.description}</p>
        <Button className='w-full mt-2' disabled={doctor.subscriptionRequired && !hasPremiumPlan}>Start Consultation <IconArrowRight /> </Button>
    </div>
  )
}

export default DoctorAgentCard