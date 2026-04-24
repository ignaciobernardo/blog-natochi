import { DEFAULT_ARCADE_MAPPING } from '@/src/lib/constants';
import type { PlayerMode } from '@/src/lib/db/schema';

export type ArcadeControlCode = keyof typeof DEFAULT_ARCADE_MAPPING;

export type ArcadeControlDefinition = {
  code: ArcadeControlCode;
  label: string;
  kind: 'direction' | 'action' | 'system';
};

const PLAYER_1_CONTROLS: ArcadeControlDefinition[] = [
  { code: 'P1_U', label: 'Up', kind: 'direction' },
  { code: 'P1_D', label: 'Down', kind: 'direction' },
  { code: 'P1_L', label: 'Left', kind: 'direction' },
  { code: 'P1_R', label: 'Right', kind: 'direction' },
  { code: 'P1_1', label: 'B1', kind: 'action' },
  { code: 'P1_2', label: 'B2', kind: 'action' },
  { code: 'P1_3', label: 'B3', kind: 'action' },
  { code: 'P1_4', label: 'B4', kind: 'action' },
  { code: 'P1_5', label: 'B5', kind: 'action' },
  { code: 'P1_6', label: 'B6', kind: 'action' },
  { code: 'START1', label: 'Start', kind: 'system' },
];

const PLAYER_2_CONTROLS: ArcadeControlDefinition[] = [
  { code: 'P2_U', label: 'Up', kind: 'direction' },
  { code: 'P2_D', label: 'Down', kind: 'direction' },
  { code: 'P2_L', label: 'Left', kind: 'direction' },
  { code: 'P2_R', label: 'Right', kind: 'direction' },
  { code: 'P2_1', label: 'B1', kind: 'action' },
  { code: 'P2_2', label: 'B2', kind: 'action' },
  { code: 'P2_3', label: 'B3', kind: 'action' },
  { code: 'P2_4', label: 'B4', kind: 'action' },
  { code: 'P2_5', label: 'B5', kind: 'action' },
  { code: 'P2_6', label: 'B6', kind: 'action' },
  { code: 'START2', label: 'Start', kind: 'system' },
];

export function getArcadePlayers(playerMode: PlayerMode | string): Array<{
  id: 1 | 2;
  title: string;
  controls: ArcadeControlDefinition[];
}> {
  return playerMode === 'two_player'
    ? [
        { id: 1, title: 'Player 1', controls: PLAYER_1_CONTROLS },
        { id: 2, title: 'Player 2', controls: PLAYER_2_CONTROLS },
      ]
    : [{ id: 1, title: 'Player 1', controls: PLAYER_1_CONTROLS }];
}

const LEGACY_CODE_MAP: Record<string, ArcadeControlCode> = {
  '1U': 'P1_U',
  '1D': 'P1_D',
  '1L': 'P1_L',
  '1R': 'P1_R',
  '1A': 'P1_1',
  '1B': 'P1_2',
  '1C': 'P1_3',
  '1X': 'P1_4',
  '1Y': 'P1_5',
  '1Z': 'P1_6',
  '1START': 'START1',
  '2U': 'P2_U',
  '2D': 'P2_D',
  '2L': 'P2_L',
  '2R': 'P2_R',
  '2A': 'P2_1',
  '2B': 'P2_2',
  '2C': 'P2_3',
  '2X': 'P2_4',
  '2Y': 'P2_5',
  '2Z': 'P2_6',
  '2START': 'START2',
};

function migrateLegacyMapping(
  mapping: Record<string, string>,
): Record<string, string> {
  const migrated: Record<string, string> = {};
  for (const [key, value] of Object.entries(mapping)) {
    const newKey = LEGACY_CODE_MAP[key] ?? key;
    migrated[newKey] = value;
  }
  return migrated;
}

export function getArcadeMergedMapping(
  mapping: Record<string, string> | null | undefined,
): Record<ArcadeControlCode, string> {
  const migrated = mapping ? migrateLegacyMapping(mapping) : {};
  return {
    ...DEFAULT_ARCADE_MAPPING,
    ...migrated,
  } as Record<ArcadeControlCode, string>;
}

export function normalizeArcadeInputValue(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();

  if (normalized === 'space' || trimmed === ' ') {
    return ' ';
  }

  return normalized;
}

export function getArcadeControlCodesForInput(
  mapping: Record<string, string> | null | undefined,
  value: string | null | undefined,
): ArcadeControlCode[] {
  const normalizedValue = normalizeArcadeInputValue(value);
  if (!normalizedValue) {
    return [];
  }

  const mergedMapping = getArcadeMergedMapping(mapping);

  return (Object.entries(mergedMapping) as Array<[ArcadeControlCode, string]>)
    .filter(([, mappedValue]) => {
      return normalizeArcadeInputValue(mappedValue) === normalizedValue;
    })
    .map(([controlCode]) => controlCode);
}

export function formatArcadeInputLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unmapped';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 'Unmapped';
  }

  const normalized = trimmed.toLowerCase();

  const specialLabels: Record<string, string> = {
    ' ': 'Space',
    space: 'Space',
    enter: 'Enter',
    escape: 'Esc',
    arrowup: 'Up Arrow',
    arrowdown: 'Down Arrow',
    arrowleft: 'Left Arrow',
    arrowright: 'Right Arrow',
    click: 'Click',
    leftclick: 'Left Click',
    rightclick: 'Right Click',
    middleclick: 'Middle Click',
  };

  if (specialLabels[normalized]) {
    return specialLabels[normalized];
  }

  if (trimmed.length === 1) {
    return trimmed.toUpperCase();
  }

  return trimmed;
}
