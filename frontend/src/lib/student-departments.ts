export const STUDENT_DEPARTMENTS = [
  "Management",
  "Information Systems",
  "Accounting",
  "International Trade",
  "Entrepreneurship",
  "Master in Management",
  "Hospitality Management",
] as const

export type StudentDepartment = (typeof STUDENT_DEPARTMENTS)[number]

export function isStudentDepartment(value: string): value is StudentDepartment {
  return (STUDENT_DEPARTMENTS as readonly string[]).includes(value)
}
