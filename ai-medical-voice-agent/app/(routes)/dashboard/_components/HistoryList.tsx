"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AddNewSessionDialog from "./AddNewSessionDialog";
import axios from "axios";
import HistoryTable from "./HistoryTable";

function HistoryList() {
  const [historyList, setHistoryList] = useState([]);
  const getHistoryList = async () => {
    const response = await axios.get("/api/session-chart?sessionId=all");
    console.log("History List Response: ",response.data);
    setHistoryList(response.data);
  };
  useEffect(() => {
    getHistoryList();
  }, []);
  return (
    <div className="mt-10">
      {historyList?.length === 0 ? (
        <div className="flex items-center flex-col justify-center p-7 border-2 border-dashed rounded-xl">
          <Image
            src={"/medical-assistance.png"}
            alt="medical-assistance"
            width={200}
            height={200}
          />
          <h2 className="text-2xl font-bold">No Recent Consultations</h2>
          <p className="text-sm text-gray-500">
            You haven't had any consultations yet.
          </p>
          <AddNewSessionDialog />
        </div>
      ) : (
        <div>
          <HistoryTable historyList={historyList} />
        </div>
      )}
    </div>
  );
}

export default HistoryList;
