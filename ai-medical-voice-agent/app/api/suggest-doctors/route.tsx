import { openai } from "@/config/OpenAiModel";
import { AIDoctorAgents } from "@/shared/list";
import { NextRequest, NextResponse } from "next/server";

// Helper function to suggest doctors based on symptoms when API fails
function suggestDoctorsBySymptoms(notes: string) {
  const symptoms = notes.toLowerCase();

  // Map common symptoms to relevant doctors
  const symptomToDoctorMap: { [key: string]: number[] } = {
    headache: [1, 4, 10], // General Physician, Psychologist, Dentist
    fever: [1, 2], // General Physician, Pediatrician
    cough: [1, 7], // General Physician, ENT
    skin: [3], // Dermatologist
    rash: [3], // Dermatologist
    acne: [3], // Dermatologist
    heart: [6], // Cardiologist
    chest: [6], // Cardiologist
    "blood pressure": [6], // Cardiologist
    bone: [8], // Orthopedic
    joint: [8], // Orthopedic
    muscle: [8], // Orthopedic
    pain: [1, 8], // General Physician, Orthopedic
    ear: [7], // ENT
    nose: [7], // ENT
    throat: [7], // ENT
    mental: [4], // Psychologist
    stress: [4], // Psychologist
    anxiety: [4], // Psychologist
    depression: [4], // Psychologist
    nutrition: [5], // Nutritionist
    diet: [5], // Nutritionist
    weight: [5], // Nutritionist
    women: [9], // Gynecologist
    pregnancy: [9], // Gynecologist
    dental: [10], // Dentist
    tooth: [10], // Dentist
    child: [2], // Pediatrician
    baby: [2], // Pediatrician
  };

  // Find matching doctors based on symptoms
  const suggestedIds = new Set<number>();

  for (const [symptom, doctorIds] of Object.entries(symptomToDoctorMap)) {
    if (symptoms.includes(symptom)) {
      doctorIds.forEach((id) => suggestedIds.add(id));
    }
  }

  // If no specific symptoms found, return General Physician
  if (suggestedIds.size === 0) {
    suggestedIds.add(1); // General Physician
  }

  // Convert to doctor objects and limit to 3
  return AIDoctorAgents.filter((doctor) => suggestedIds.has(doctor.id)).slice(
    0,
    3
  );
}

export async function POST(req: NextRequest) {
  const { notes } = await req.json();
  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "system",
          content: JSON.stringify(AIDoctorAgents),
        },
        {
          role: "user",
          content: `User Notes/symptoms: ${notes}

          Based on the user's symptoms, suggest ONLY doctors from the provided list above. Return the COMPLETE doctor objects (with all fields: id, specialist, description, image, agentPrompt, voiceId, subscriptionRequired) in JSON format.

          Return format:
          {
            "doctors": [
              {
                "id": number,
                "specialist": "string",
                "description": "string", 
                "image": "string",
                "agentPrompt": "string",
                "voiceId": "string",
                "subscriptionRequired": boolean
              }
            ]
          }

          Only return doctors from the provided list, no other doctors.`,
        },
      ],
    });
    const rawResponse = completion.choices[0].message;
    // @ts-ignore
    const ResString = rawResponse.content
      .trim()
      .replace("```json", "")
      .replace("```", "");
    const JSONResponse = JSON.parse(ResString);
    return NextResponse.json(JSONResponse?.doctors || []);
  } catch (error: any) {
    // Handle rate limit error (429) by returning symptom-based fallback doctors
    if (error.status === 429 || error.code === 429) {
      return NextResponse.json(suggestDoctorsBySymptoms(notes));
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
