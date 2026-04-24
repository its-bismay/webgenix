import { inngest } from "./client";
import { createAgent, gemini } from "@inngest/agent-kit";

export const processTask = inngest.createFunction(
	{ id: "process-task" },
	{ event: "app/task.created" },
	async ({ event }) => {
		const agent = createAgent({
			name: "ai-agent",
			system: "You are an assistant for answering questions to user queries.",
			model: gemini({ model: "gemini-3.1-flash-lite-preview" }),
		});

		const { output } = await agent.run(
			`Answer the following user query: ${event.data.input}`,
		);

		return { output };
	},
);
