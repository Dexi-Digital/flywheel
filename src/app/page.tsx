import { redirect } from 'next/navigation';
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootPage() {
  // Redirect to login - the middleware will handle authenticated users
  redirect('/login');
}
