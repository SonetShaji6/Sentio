import Session from "../models/Session";
import Presentation from "../models/Presentation";

/**
 * Generates a unique 6-digit numeric session code (e.g. "492018").
 * Verifies that the code is not actively in use by any live/ready Session
 * or Presentation.
 */
export async function generateUnique6DigitCode(): Promise<string> {
  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    attempts++;
    // Generate random 6-digit number between 100000 and 999999
    code = Math.floor(100000 + Math.random() * 900000).toString();

    const [existingSession, existingPresentation] = await Promise.all([
      Session.findOne({
        joinCode: code,
        status: { $ne: "ended" },
      }),
      Presentation.findOne({
        sessionCode: code,
        isDeleted: false,
      }),
    ]);

    if (!existingSession && !existingPresentation) {
      isUnique = true;
    }
  }

  return code;
}
