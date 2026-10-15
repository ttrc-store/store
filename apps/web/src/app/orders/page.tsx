import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export default async function OrdersRedirectPage() {
  const auth = await getAuthenticatedUser();
  if ('user' in auth && auth.user) {
    redirect('/account/orders');
  }
  redirect('/login?redirectTo=/account/orders');
}
