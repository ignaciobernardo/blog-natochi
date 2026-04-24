'use client';

import { Gamepad2, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { DEFAULT_ARCADE_MAPPING } from '@/src/lib/constants';
import { updateMappingAction } from '../_actions/update-mapping.action';

interface ArcadeMappingEditorProps {
  gameId: string;
  currentMapping: Record<string, string> | null;
}

// Mapping labels for display
const _MAPPING_LABELS: Record<string, string> = {
  P1_U: 'Player 1 Up',
  P1_D: 'Player 1 Down',
  P1_L: 'Player 1 Left',
  P1_R: 'Player 1 Right',
  P1_1: 'Player 1 Button 1',
  P1_2: 'Player 1 Button 2',
  P1_3: 'Player 1 Button 3',
  P1_4: 'Player 1 Button 4',
  P1_5: 'Player 1 Button 5',
  P1_6: 'Player 1 Button 6',
  START1: 'Player 1 Start',
  P2_U: 'Player 2 Up',
  P2_D: 'Player 2 Down',
  P2_L: 'Player 2 Left',
  P2_R: 'Player 2 Right',
  P2_1: 'Player 2 Button 1',
  P2_2: 'Player 2 Button 2',
  P2_3: 'Player 2 Button 3',
  P2_4: 'Player 2 Button 4',
  P2_5: 'Player 2 Button 5',
  P2_6: 'Player 2 Button 6',
  START2: 'Player 2 Start',
};

const PLAYER_1_CONTROLS = [
  { key: 'P1_U', label: 'Up' },
  { key: 'P1_D', label: 'Down' },
  { key: 'P1_L', label: 'Left' },
  { key: 'P1_R', label: 'Right' },
  { key: 'P1_1', label: 'Button 1' },
  { key: 'P1_2', label: 'Button 2' },
  { key: 'P1_3', label: 'Button 3' },
  { key: 'P1_4', label: 'Button 4' },
  { key: 'P1_5', label: 'Button 5' },
  { key: 'P1_6', label: 'Button 6' },
  { key: 'START1', label: 'Start' },
];

const PLAYER_2_CONTROLS = [
  { key: 'P2_U', label: 'Up' },
  { key: 'P2_D', label: 'Down' },
  { key: 'P2_L', label: 'Left' },
  { key: 'P2_R', label: 'Right' },
  { key: 'P2_1', label: 'Button 1' },
  { key: 'P2_2', label: 'Button 2' },
  { key: 'P2_3', label: 'Button 3' },
  { key: 'P2_4', label: 'Button 4' },
  { key: 'P2_5', label: 'Button 5' },
  { key: 'P2_6', label: 'Button 6' },
  { key: 'START2', label: 'Start' },
];

export function ArcadeMappingEditor({
  gameId,
  currentMapping,
}: ArcadeMappingEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [mapping, setMapping] = useState<Record<string, string>>(
    currentMapping || DEFAULT_ARCADE_MAPPING,
  );

  useEffect(() => {
    setMapping(currentMapping || DEFAULT_ARCADE_MAPPING);
  }, [currentMapping]);

  const handleInputChange = (key: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [key]: value.toLowerCase().trim(),
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMappingAction(gameId, mapping);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleReset = () => {
    setMapping(DEFAULT_ARCADE_MAPPING);
    toast.info('Mapping reset to defaults');
  };

  const renderControlGroup = (
    title: string,
    controls: Array<{ key: string; label: string }>,
    _playerNumber: 1 | 2,
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4" />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {controls.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key} className="text-xs">
                {label}
              </Label>
              <Input
                id={key}
                value={mapping[key] || ''}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={DEFAULT_ARCADE_MAPPING[key] || ''}
                className="h-8 font-mono text-sm"
                disabled={isPending}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasChanges =
    JSON.stringify(mapping) !==
    JSON.stringify(currentMapping || DEFAULT_ARCADE_MAPPING);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {renderControlGroup('Player 1 Controls', PLAYER_1_CONTROLS, 1)}
        {renderControlGroup('Player 2 Controls', PLAYER_2_CONTROLS, 2)}
      </div>

      <div className="flex items-center gap-2 border-t pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {isPending ? 'Saving...' : 'Save Mapping'}
        </Button>
        <Button
          onClick={handleReset}
          disabled={isPending}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        {hasChanges && (
          <span className="text-muted-foreground text-xs">
            You have unsaved changes
          </span>
        )}
      </div>

      <div className="space-y-2 rounded-md bg-muted p-3">
        <p className="text-muted-foreground text-xs">
          <strong>Keyboard keys:</strong> Enter keys in lowercase (e.g., 'w',
          'space', 'ArrowUp'). Special keys: 'space', 'Enter', 'ArrowUp',
          'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'.
        </p>
        <p className="text-muted-foreground text-xs">
          <strong>Mouse actions:</strong> Use 'click' or 'leftclick' for left
          click, 'rightclick' for right click, 'middleclick' for middle click.
          Clicks are emitted at the center of the game canvas.
        </p>
      </div>
    </div>
  );
}
