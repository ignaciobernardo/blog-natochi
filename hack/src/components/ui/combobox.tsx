'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/src/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/components/ui/popover';
import { cn } from '@/src/lib/utils';

interface ComboboxOption {
  value: string;
  label: string;
  emoji?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  firstOptionValue?: string;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  firstOptionValue,
  placeholder = 'Select an option...',
  emptyText = 'No option found.',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const orderedOptions = React.useMemo(() => {
    if (!firstOptionValue) return options;

    const pinnedOptionIndex = options.findIndex(
      (option) => option.value === firstOptionValue,
    );

    if (pinnedOptionIndex <= 0) return options;

    const pinnedOption = options[pinnedOptionIndex];
    return [
      pinnedOption,
      ...options.slice(0, pinnedOptionIndex),
      ...options.slice(pinnedOptionIndex + 1),
    ];
  }, [options, firstOptionValue]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-card text-foreground border-border',
            !value && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.emoji && (
              <span className="text-lg">{selectedOption.emoji}</span>
            )}
            <span>{selectedOption ? selectedOption.label : placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {orderedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={(currentValue) => {
                    onValueChange?.(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.emoji && (
                    <span className="mr-2 text-lg">{option.emoji}</span>
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
