"use client"
import { useParams } from 'next/navigation'
import React from 'react'

function MedicalVoiceAgent() {
    const { sessionId } = useParams()
  return (
    <div>MedicalVoiceAgent {sessionId}</div>
  )
}

export default MedicalVoiceAgent