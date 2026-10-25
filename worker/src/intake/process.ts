// Runs after a patient's send has been stored (ctx.waitUntil), so the patient isn't kept waiting on the AI.
export async function processIntake(_env: Env, _intakeId: string): Promise<void> {
  // Filled in by the AI step (drug extraction + Japanese translation of free text).
}
