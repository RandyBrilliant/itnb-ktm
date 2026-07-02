import { Navigate } from "react-router-dom"

export function StudentWebinarsPage() {
  return <Navigate to="/student/certificates?tab=webinars" replace />
}

export default StudentWebinarsPage
