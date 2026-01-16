import { Level } from '@/lib/gameData';
import { MarshmallowVisual } from './visuals/MarshmallowVisual';
import { FatigueVisual } from './visuals/FatigueVisual';
import { UnreliableVisual } from './visuals/UnreliableVisual';
import { BrokenContractVisual } from './visuals/BrokenContractVisual';
import { StarvationVisual } from './visuals/StarvationVisual';
import { ShrinkingMarshmallowVisual } from './visuals/ShrinkingMarshmallowVisual';
import { LootBoxVisual } from './visuals/LootBoxVisual';
import { MarshmallowPileVisual } from './visuals/MarshmallowPileVisual';
import { MirrorVisual } from './visuals/MirrorVisual';

interface ScenarioVisualProps {
  level: Level;
}

export function ScenarioVisual({ level }: ScenarioVisualProps) {
  switch (level.visualType) {
    case 'marshmallow':
      return <MarshmallowVisual />;
    case 'fatigue':
      return <FatigueVisual />;
    case 'unreliable':
      return <UnreliableVisual />;
    case 'broken':
      return <BrokenContractVisual />;
    case 'starvation':
      return <StarvationVisual />;
    case 'inflation':
      return <ShrinkingMarshmallowVisual />;
    case 'lootbox':
      return <LootBoxVisual />;
    case 'treadmill':
      return <MarshmallowPileVisual />;
    case 'mirror':
      return <MirrorVisual />;
    default:
      return <MarshmallowVisual />;
  }
}
