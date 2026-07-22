"use client";

import { ImportExcelGuide } from "@/components/teacher/import/ImportExcelGuide";
import { ImportWordGuide } from "@/components/teacher/import/ImportWordGuide";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileText } from "lucide-react";

export function ImportFormatTabs() {
  return (
    <Tabs defaultValue="excel" className="w-full" dir="rtl">
      <TabsList className="h-auto min-h-11 w-full flex-wrap gap-1 p-1">
        <TabsTrigger
          value="excel"
          className="flex-1 gap-1.5 whitespace-normal px-3 py-2"
        >
          <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden />
          Excel / CSV
        </TabsTrigger>
        <TabsTrigger
          value="word"
          className="flex-1 gap-1.5 whitespace-normal px-3 py-2"
        >
          <FileText className="size-3.5 shrink-0" aria-hidden />
          Word / Text
        </TabsTrigger>
      </TabsList>
      <TabsContent value="excel" className="mt-4">
        <ImportExcelGuide />
      </TabsContent>
      <TabsContent value="word" className="mt-4">
        <ImportWordGuide />
      </TabsContent>
    </Tabs>
  );
}
