import { Dashboard } from '@/components/dashboard';

export const metadata = {
  title: 'NYC Pokémon Map',
  description: 'Interactive map of Pokémon in New York City with advanced filtering',
};

export const dynamic = 'force-dynamic';

export default function Home() {
  return <Dashboard />;
}
