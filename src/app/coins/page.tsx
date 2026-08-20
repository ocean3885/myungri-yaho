import { auth } from '@/auth';
import CoinShop from './CoinShop';

export default async function CoinsPage() {
  const session = await auth();
  return <CoinShop isAuthenticated={Boolean(session?.user?.id)} />;
}
