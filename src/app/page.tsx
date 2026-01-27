import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to login - the middleware will handle authenticated users
  redirect('/login');
}
