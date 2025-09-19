"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconArrowRight } from "@tabler/icons-react";
import axios from "axios";
import { doctorAgent } from "./DoctorAgentCard";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SuggestedDocterCard from "./SuggestedDocterCard";

function AddNewSessionDialog() {
  const [note, setNote] = useState("");
  const [loading, setloading] = useState(false);
  const [suggestDoctors, setsuggestDoctors] = useState<doctorAgent[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent | null>(
    null
  );

  // console.log('====================================');
  // console.log("suggestDoctors: ",suggestDoctors);
  // console.log('====================================');

  const handleNext = async () => {
    try {
      setloading(true);
      const response = await axios.post("/api/suggest-doctors", {
        notes: note,
      });
      const data = response.data;
      console.log("data: ",data);
      setsuggestDoctors(data);
    } catch (error) {
      console.log(error);
      toast.error("Error suggesting doctors");
    } finally {
      setloading(false);
    }
  };

  const onStartConsultation = async () => {
    try {
      setloading(true);
      // Save all the conversation in database
      const response = await axios.post("/api/session-chart", {
        notes: note,
        selectedDoctor: selectedDoctor,
      });
      const data = response.data;
      if(data?.sessionId){
       console.log("sessionId: ",data?.sessionId);
       // Route new consultation screen
      //  router.push(`/dashboard/medical-agent/${data?.sessionId}`);
      }
      toast.success("Consultation started");
    } catch (error) {
      console.log(error);
      toast.error("Error starting consultation");
    } finally {
      setloading(false);
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer mt-10">+ Start a Consultation</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Basic Information</DialogTitle>
          <DialogDescription asChild>
            {suggestDoctors.length === 0 ? (
              <div>
                <p className="text-sm text-gray-500">
                  Please add your symptom to start a consultation.
                </p>
                <Textarea
                  placeholder="e.g. I have a headache, I have a fever, I have a cough"
                  className="mt-2 h-[100px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold">Suggested Doctors</h2>
                <div className="grid grid-cols-3 gap-5 mt-5 cursor-pointer">
                  {suggestDoctors?.map((doctor) => (
                    <SuggestedDocterCard
                      key={doctor.id}
                      doctor={doctor}
                      setSelectedDoctor={setSelectedDoctor}
                      selectedDoctor={selectedDoctor}
                    />
                  ))}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          {suggestDoctors.length === 0 ? (
            <Button
              className="cursor-pointer"
              disabled={!note || loading}
              onClick={handleNext}
            >
              Next{" "}
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <IconArrowRight />
              )}
            </Button>
          ) : (
            <Button onClick={onStartConsultation} disabled={loading}>
              Start Consultation {loading ? <Loader2 className="animate-spin" /> : <IconArrowRight />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddNewSessionDialog;
