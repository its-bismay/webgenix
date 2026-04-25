import { inngest } from "./client";
import {
	createAgent,
	createNetwork,
	createTool,
	gemini,
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastMsgFromAgent } from "./utils";
import z from "zod";
import { PROMPT } from "@/prompt";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const processTask = inngest.createFunction(
	{ id: "ai-coding-agent" },
	{ event: "app/agent.code" },
	async ({ event, step }) => {
		const sandboxId = await step.run("get-sandbox-id", async () => {
			const sandbox = await Sandbox.create("d5c9c0yzchplwomv2vrp", {
				timeoutMs: 1000 * 60 * 30,
			});
			return sandbox.sandboxId;
		});

		const agent = createAgent({
			name: "ai-agent",
			description: "An expert coding ai-agent",
			system: PROMPT,
			model: gemini({
				model: "gemini-2.5-flash-lite",
			}),
			tools: [
				createTool({
					name: "terminal",
					description: "Use the terminal to run commands.",
					parameters: z.object({
						command: z.string(),
					}),
					handler: async ({ command }, { step }) => {
						return await step?.run("terminal", async () => {
							const buffers = { stdout: "", stderr: "" };
							try {
								const sandbox = await getSandbox(sandboxId);
								const result = await sandbox.commands.run(
									command,
									{
										onStdout: (data: string) => {
											buffers.stdout += data;
										},
										onStderr: (data: string) => {
											buffers.stderr += data;
										},
									},
								);
								return result.stdout;
							} catch (error) {
								console.error(
									`Command failed: ${error} \nstdout: ${buffers.stdout} \nstderror: ${buffers.stderr} `,
								);
								return `command failed: ${error} \nstdout: ${buffers.stdout} \nstderror: ${buffers.stderr}`;
							}
						});
					},
				}),
				createTool({
					name: "create-or-update-files",
					description:
						"Use this tool to create or update files in the sandbox",
					parameters: z.object({
						files: z.array(
							z.object({
								path: z.string(),
								content: z.string(),
							}),
						),
					}),
					handler: async ({ files }, { step, network }) => {
						const newFiles = await step?.run(
							"create-or-update-files",
							async () => {
								try {
									const updatedFiles =
										network.state.data.files || {};
									const sandbox = await getSandbox(sandboxId);
									for (const file of files) {
										await sandbox.files.write(
											file.path,
											file.content,
										);
										updatedFiles[file.path] = file.content;
									}
									return updatedFiles;
								} catch (error) {
									return "Error: " + error;
								}
							},
						);

						if (typeof newFiles === "object") {
							network.state.data.files = newFiles;
						}
					},
				}),
				createTool({
					name: "read-files",
					description: "Use this tool to read files from the sandbox",
					parameters: z.object({
						files: z.array(z.string()),
					}),
					handler: async ({ files }, { step }) => {
						return await step?.run("read-files", async () => {
							try {
								const sandbox = await getSandbox(sandboxId);
								const contents = [];
								for (const file of files) {
									const content =
										await sandbox.files.read(file);
									contents.push({ path: file, content });
								}
								return JSON.stringify(contents);
							} catch (error) {
								return "Error: " + error;
							}
						});
					},
				}),
			],
			lifecycle: {
				onResponse: async ({ result, network }) => {
					const lastAgentText = lastMsgFromAgent(result);

					if (lastAgentText && network) {
						if (lastAgentText.includes("<task_summary>")) {
							network.state.data.summary = lastAgentText;
						}
					}

					return result;
				},
			},
		});

		const network = createNetwork({
			name: "coding-agent-network",
			agents: [agent],
			maxIter: 15,
			router: async ({ network }) => {
				const summary = network.state.data.summary;
				if (summary) return;
				await sleep(7000);
				return agent;
			},
		});

		const result = await network.run(event.data.input);

		const sandboxUrl = await step.run("get-sandbox-url", async () => {
			const sandbox = await getSandbox(sandboxId);
			const host = sandbox.getHost(3000);
			return `https://${host}`;
		});

		return {
			url: sandboxUrl,
			title: "Fragment",
			files: result.state.data.files,
			summary: result.state.data.summary,
		};
	},
);
