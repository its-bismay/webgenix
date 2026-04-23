"use client"

import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

const Client = () => {
    const trpc = useTRPC()
    const { data } = useSuspenseQuery(trpc.greetFunction.queryOptions({ text: "world" }))
  return (
    <div className="w-5xl h-36 bg-emerald-300 text-white font-medium">{JSON.stringify(data)}</div>
  )
}
export default Client