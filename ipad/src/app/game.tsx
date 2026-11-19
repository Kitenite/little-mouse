import { useLocalSearchParams } from 'expo-router';
import Game from '../components/Game';
import { DEFAULT_GAME, normalizeGameUrl } from '../connection';
export default function GameRoute() {
  const params = useLocalSearchParams<{ url?: string }>();
  let url: string; try { url = normalizeGameUrl(params.url || DEFAULT_GAME); } catch { url = DEFAULT_GAME; }
  return <Game url={url} />;
}
