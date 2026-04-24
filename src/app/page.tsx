"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const Page = () => {

  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.success("Background jobs invoked successfully!");
    }
  }))
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)}/>
      <Button variant="default" onClick={() => invoke.mutate({ input: value})} disabled={invoke.isPending}>
        Invoke Background Jobs
      </Button>
    </div>
  )
}
export default Page