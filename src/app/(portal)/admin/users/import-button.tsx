"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { importUsersFromSheetAction } from "./actions";
import { useRouter } from "next/navigation";

export function ImportUsersButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleImport = () => {
    startTransition(async () => {
      const result = await importUsersFromSheetAction();
      if (result.error) {
        alert(result.error);
      } else {
        alert(`Import successful! Added ${result.added} new users. Skipped ${result.skipped}.`);
        router.refresh();
      }
    });
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleImport} 
      disabled={isPending}
      className="flex items-center gap-2"
    >
      {isPending ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Importing...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Import
        </>
      )}
    </Button>
  );
}
