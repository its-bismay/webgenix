import { Button } from "@/components/ui/button"
import { getQueryClient, trpc } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Client from "./Client";
import { Suspense } from "react";


const Page = async () => {

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.greetFunction.queryOptions({ text: "world" }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
      <Client />
      </Suspense>
    </HydrationBoundary>
  )
}
export default Page