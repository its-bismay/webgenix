import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSandbox(sandboxId: string) {
	const sandbox = await Sandbox.connect(sandboxId);
	return sandbox;
}

export function lastMsgFromAgent(result: AgentResult) {
	const idxofLastMsgOfAgent = result.output.findLastIndex(
		(message) => message.role === "assistant",
	);

	const msg = result.output[idxofLastMsgOfAgent] as TextMessage | undefined;

	return msg?.content
		? typeof msg.content === "string"
			? msg.content
			: msg.content.map((c) => c.text).join("")
		: undefined;
}
