import { inngest } from "./client";
import { createAgent, gemini } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";

export const processTask = inngest.createFunction(
	{ id: "process-task" },
	{ event: "app/task.created" },
	async ({ event, step }) => {
		const sandboxId = await step.run("get-sandbox-id", async () => {
			const sandbox = await Sandbox.create("d5c9c0yzchplwomv2vrp");
			return sandbox.sandboxId;
		});

		const agent = createAgent({
			name: "ai-agent",
			system: "You are an assistant for answering questions to user queries.",
			model: gemini({ model: "gemini-3.1-flash-lite-preview" }),
		});

		const { output } = await agent.run(
			`Answer the following user query: ${event.data.input}`,
		);

		const sandboxUrl = await step.run("get-sandbox-url", async () => {
			const sandbox = await getSandbox(sandboxId);
			const host = sandbox.getHost(3000);
			return `https://${host}`;
		});

		return { output, sandboxUrl };
	},
);
