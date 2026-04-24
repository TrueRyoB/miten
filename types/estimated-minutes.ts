/** Unacceptable cases for the “estimated minutes” field (timer). */
export enum EstimatedMinutesIssue {
  None = "None",
  Required = "Required",
  NotANumber = "NotANumber",
  NotInteger = "NotInteger",
  NotPositive = "NotPositive",
  ExceedsMaximum = "ExceedsMaximum",
}

export const ESTIMATED_MINUTES_MAX = 99_999

export function validateEstimatedMinutesRaw(raw: string): EstimatedMinutesIssue {
  const trimmed = raw.trim()
  if (trimmed === "") return EstimatedMinutesIssue.Required

  const n = Number(trimmed)
  if (!Number.isFinite(n)) return EstimatedMinutesIssue.NotANumber
  if (!Number.isInteger(n)) return EstimatedMinutesIssue.NotInteger
  if (n <= 0) return EstimatedMinutesIssue.NotPositive
  if (n > ESTIMATED_MINUTES_MAX) return EstimatedMinutesIssue.ExceedsMaximum

  return EstimatedMinutesIssue.None
}

export function estimatedMinutesIssueMessage(issue: EstimatedMinutesIssue): string {
  switch (issue) {
    case EstimatedMinutesIssue.None:
      return ""
    case EstimatedMinutesIssue.Required:
      return "Please enter an estimated time in minutes."
    case EstimatedMinutesIssue.NotANumber:
      return "Enter a valid number."
    case EstimatedMinutesIssue.NotInteger:
      return "Use whole minutes only (no decimals)."
    case EstimatedMinutesIssue.NotPositive:
      return "Minutes must be greater than 0."
    case EstimatedMinutesIssue.ExceedsMaximum:
      return `Please enter at most ${ESTIMATED_MINUTES_MAX.toLocaleString()} minutes.`
    default:
      return ""
  }
}
