import { Level } from '@/lib/gameData';
import {
  MarshmallowVisual,
  BatteryVisual,
  TVVisual,
  WalletVisual,
  EmbarrassmentVisual,
  TeethVisual,
} from './visuals';

interface ScenarioVisualProps {
  level: Level;
}

export function ScenarioVisual({ level }: ScenarioVisualProps) {
  switch (level.visualType) {
    case 'marshmallow':
      return <MarshmallowVisual />;
    case 'battery':
      return <BatteryVisual />;
    case 'tv':
      return <TVVisual />;
    case 'wallet':
      return <WalletVisual />;
    case 'embarrassment':
      return <EmbarrassmentVisual />;
    case 'teeth':
      return <TeethVisual />;
    default:
      return null;
  }
}
