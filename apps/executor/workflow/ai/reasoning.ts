export function buildReasoningInstruction(reasoningEnabled: boolean): string {
  if (!reasoningEnabled) return "";

  return `Before providing your final answer, break down your analysis into step-by-step reasoning.

Output a "reasoningSteps" array where each step has:
- "step": the step number (1, 2, 3, ...)
- "title": a short title for this reasoning step
- "reasoning": your detailed analysis for this step
- "conclusion": what you conclude from this step (optional)

Then provide your final answer in the specified output format.
The "reasoningSteps" field is NOT part of the final answer schema — it documents your thinking.`;
}
