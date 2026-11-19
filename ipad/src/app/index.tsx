import Game from '../components/Game';
import { DEFAULT_GAME } from '../connection';

// The web game owns the single Play entry and local owner settings.
export default function Home() {
  return <Game url={DEFAULT_GAME} close={() => {}} />;
}
