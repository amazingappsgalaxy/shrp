import { redirect } from 'next/navigation'

// Page has been renamed to /app/image
export default function OldImagePage() {
  redirect('/app/image')
}
