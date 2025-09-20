"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SessionDetailsType } from "../medical-agent/[sessionId]/page";
import { Button } from "@/components/ui/button";
import moment from "moment";
import ViewReportDialog from "./ViewReportDialog";

type props = {
  historyList: SessionDetailsType[];
};

function HistoryTable({ historyList }: props) {
  return (
    <div>
      <Table>
        <TableCaption>Previous consultations Reports</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">AI Medical Specialist</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyList &&
            historyList?.map((record: SessionDetailsType, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {record?.selectedDoctor?.specialist}
                </TableCell>
                <TableCell>{record?.notes}</TableCell>
                <TableCell>{moment(record?.createdOn).fromNow()}</TableCell>
                <TableCell className="text-right">
                  <ViewReportDialog record={record} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default HistoryTable;
