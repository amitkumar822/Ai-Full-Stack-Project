"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState } from "react";
import AddNewSessionDialog from "./AddNewSessionDialog";

function HistoryList() {
  const [historyList, setHistoryList] = useState([]);
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
        <div>HistoryList</div>
      )}
    </div>
  );
}

export default HistoryList;
