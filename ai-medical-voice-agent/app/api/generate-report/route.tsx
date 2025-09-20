import { db } from "@/config/db";
import { openai } from "@/config/OpenAiModel";
import { SessionChartTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const REPORT_GENERATION_PROMPT = `You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on the transcript, generate a structured report with the following fields:

    1. sessionId: a unique session identifier
    2. agent: the medical specialist name (e.g., "General Physician AI")
    3. user: name of the patient or "Anonymous" if not provided
    4. timestamp: current date and time in ISO format
    5. chiefComplaint: one-sentence summary of the main health concern
    6. summary: a 2-3 sentence summary of the conversation, symptoms, and recommendations
    7. symptoms: list of symptoms mentioned by the user
    8. duration: how long the user has experienced the symptoms
    9. severity: mild, moderate, or severe
    10. medicationsMentioned: list of any medicines mentioned
    11. recommendations: list of AI suggestions (e.g., rest, see a doctor)
    Return the result in this JSON format:
    {
    "sessionId": "string",
    "agent": "string",
    "user": "string",
    "timestamp": "ISO Date string",
    "chiefComplaint": "string",
    "summary": "string",
    "symptoms": ["symptom1", "symptom2"],
    "duration": "string",
    "severity": "string",
    "medicationsMentioned": ["med1", "med2"],
    "recommendations": ["rec1", "rec2"],
    }

    Only include valid fields. Respond with nothing else.

    `;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, sessionDetails } = await req.json();
    
    // Validate required fields
    if (!messages || !sessionId || !sessionDetails) {
      return NextResponse.json(
        { error: "Missing required fields: messages, sessionId, or sessionDetails" },
        { status: 400 }
      );
    }

    const UserInput = `AI Doctor Agent Info: ${JSON.stringify(sessionDetails)}, Conversation: ${JSON.stringify(messages)}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a more reliable model
      messages: [
        {
          role: "system",
          content: REPORT_GENERATION_PROMPT,
        },
        {
          role: "user",
          content: UserInput,
        },
      ],
      temperature: 0.1, // Lower temperature for more consistent JSON output
    });
    
    const rawResponse = completion.choices[0].message;
    
    if (!rawResponse.content) {
      throw new Error("No content received from OpenAI");
    }
    
    // Clean and parse the JSON response
    const ResString = rawResponse.content
      .trim()
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^\s*/, "")
      .replace(/\s*$/, "");
    
    let JSONResponse;
    try {
      JSONResponse = JSON.parse(ResString);
    } catch (parseError) {
      throw new Error("Invalid JSON response from AI");
    }
    
    // Ensure the report has the sessionId
    JSONResponse.sessionId = sessionId;
    JSONResponse.timestamp = new Date().toISOString();
    
    // Update the session details with the report
    await db
      .update(SessionChartTable)
      .set({ 
        report: JSONResponse, 
        conversation: messages 
      })
      .where(eq(SessionChartTable.sessionId, sessionId)); // Use sessionId instead of id

    return NextResponse.json(JSONResponse);
  } catch (error) {
    console.error("Error generating report: ", error);
    return NextResponse.json(
      { 
        error: "Failed to generate report", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
