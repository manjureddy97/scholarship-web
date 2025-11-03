export function validateTranscript(meta: { hasName: boolean; hasCourses: boolean; hasFinalGrades: boolean; hasCumulativeGpa: boolean; }) {
  const reasons: string[] = []
  if (!meta.hasName) reasons.push('Missing student name')
  if (!meta.hasCourses) reasons.push('Missing list of completed coursework')
  if (!meta.hasFinalGrades) reasons.push('Missing final grades')
  if (!meta.hasCumulativeGpa) reasons.push('Missing cumulative GPA or credits per course')
  return { valid: reasons.length === 0, reasons }
}
