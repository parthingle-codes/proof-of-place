/**
 * SAMPLE analysis used only when DEMO_MODE=true.
 * Every response carrying this is flagged to the user as sample data.
 * It is NEVER presented as output from the model.
 */
export const DEMO_ANALYSIS = {
  category: "Plumbing",
  issue_title: "Leaking tap outside Room 204",
  problem_summary:
    "A tap outside Room 204 is reported as leaking. Cause and leak pattern are not yet established.",
  observed_facts: [
    "Sample entry: water visible at the spout in the supplied photo",
  ],
  user_reported_details: ["The tap outside Room 204 keeps leaking"],
  suggested_follow_up_questions: [
    "Is the water leaking continuously, or only when the tap is turned on?",
    "Which building and floor is Room 204 in?",
    "When did the leaking start?",
  ],
  missing_information: [
    "Leak pattern (continuous or intermittent)",
    "Building and floor",
    "Duration of the problem",
  ],
  hypotheses: [
    "Possibly a worn washer or cartridge in the tap",
    "Could be a loose connection under the sink",
  ],
  suggested_next_action:
    "Send a plumber to inspect the tap and check the supply connection underneath.",
  urgency_indicators: [
    "Standing water near a floor could become a slip hazard - confirm on site",
  ],
  uncertainties: [
    "Sample entry: whether the photo shows this exact tap",
    "Sample entry: whether the leak is continuous",
  ],
};
