// app/dashboard/projects/page.tsx
// Redirect to main dashboard which shows projects
import { redirect } from 'next/navigation'

export default function ProjectsPage() {
  redirect('/dashboard')
}
