import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SessionDetailsType } from "../medical-agent/[sessionId]/page";
import { Stethoscope, X } from "lucide-react";
import moment from "moment";

type props = {
  record: SessionDetailsType;
};

function ViewReportDialog({ record }: props) {
  // Parse the report data from the record
  const reportData = record?.report as any;
  
  // Format timestamp to readable date using moment.js
  const formatDate = (timestamp: string) => {
    return moment(timestamp).format('MMMM Do YYYY, h:mm a');
  };

  // Capitalize first letter of text
  const capitalizeFirstLetter = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"link"} size={"sm"} className="cursor-pointer">
          View Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          {/* Header with medical icon and close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <DialogTitle className="text-2xl font-bold text-blue-600">
                Medical AI Voice Agent Report
              </DialogTitle>
            </div>
          </div>

          {/* Report Content */}
          <div className="space-y-6">
            {/* Session Info Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Session Info</h2>
                <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Doctor:</span> {capitalizeFirstLetter(record?.selectedDoctor?.specialist || reportData?.agent || 'General Physician')}
                </div>
                <div>
                  <span className="font-medium">User:</span> {capitalizeFirstLetter(reportData?.user || 'Anonymous')}
                </div>
                <div>
                  <span className="font-medium">Consulted On:</span> {formatDate(reportData?.timestamp || record?.createdOn)}
                </div>
                <div>
                  <span className="font-medium">Agent:</span> {capitalizeFirstLetter(reportData?.agent || 'General Physician AI')}
                </div>
              </div>
            </div>

            {/* Chief Complaint Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Chief Complaint</h2>
                <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
              </div>
              <p className="text-sm text-gray-700">
                {capitalizeFirstLetter(reportData?.chiefComplaint || 'The user did not clearly state a chief complaint in this initial interaction.')}
              </p>
            </div>

            {/* Summary Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Summary</h2>
                <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
              </div>
              <p className="text-sm text-gray-700">
                {capitalizeFirstLetter(reportData?.summary || 'The AI medical assistant introduced itself and asked the user how they were feeling. The user has not yet provided any specific symptoms or concerns.')}
              </p>
            </div>

            {/* Symptoms Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Symptoms</h2>
                <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
              </div>
              <div className="text-sm text-gray-700">
                {reportData?.symptoms && reportData.symptoms.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {reportData.symptoms.map((symptom: string, index: number) => (
                      <li key={index}>{capitalizeFirstLetter(symptom)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No specific symptoms are listed.</p>
                )}
              </div>
            </div>

            {/* Duration & Severity Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-600">Duration & Severity</h2>
                <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Duration:</span> {capitalizeFirstLetter(reportData?.duration || 'Not specified')}
                </div>
                <div>
                  <span className="font-medium">Severity:</span> {capitalizeFirstLetter(reportData?.severity || 'Not specified')}
                </div>
              </div>
            </div>

            {/* Recommendations Section (if available) */}
            {reportData?.recommendations && reportData.recommendations.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-blue-600">Recommendations</h2>
                  <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
                </div>
                <div className="text-sm text-gray-700">
                  <ul className="list-disc list-inside space-y-1">
                    {reportData.recommendations.map((recommendation: string, index: number) => (
                      <li key={index}>{capitalizeFirstLetter(recommendation)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Medications Mentioned Section (if available) */}
            {reportData?.medicationsMentioned && reportData.medicationsMentioned.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-blue-600">Medications Mentioned</h2>
                  <div className="h-0.5 bg-blue-600 w-full mt-1"></div>
                </div>
                <div className="text-sm text-gray-700">
                  <ul className="list-disc list-inside space-y-1">
                    {reportData.medicationsMentioned.map((medication: string, index: number) => (
                      <li key={index}>{capitalizeFirstLetter(medication)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                This report was generated by an AI Medical Assistant for informational purposes only.
              </p>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default ViewReportDialog;
