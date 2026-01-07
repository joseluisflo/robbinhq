'use client';

import React from 'react';
import { MentionsInput as ReactMentionsInput, Mention } from 'react-mentions';
import type { Suggestion } from '@/components/ui/tag-input';

interface MentionsInputProps {
  id: string;
  value: string;
  onChange: (event: any, newValue: string, newPlainTextValue: string, mentions: any[]) => void;
  suggestions: Suggestion[];
  placeholder?: string;
}

export function MentionsInputComponent({ id, value, onChange, suggestions, placeholder }: MentionsInputProps) {
  const mentionData = suggestions.map(s => ({
    id: s.value,
    display: s.value,
  }));

  return (
    <div className="mentions-wrapper">
      <ReactMentionsInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mentions"
        classNames={{
          control: 'mentions__control',
          input: 'mentions__input',
          suggestions: 'mentions__suggestions',
          list: 'mentions__suggestions__list',
          item: 'mentions__suggestions__item',
          'item--focused': 'mentions__suggestions__item--focused',
        }}
      >
        <Mention
          trigger="[["
          data={mentionData}
          markup="[[__display__]]"
          className="mentions__mention"
          appendSpaceOnAdd
        />
      </ReactMentionsInput>
    </div>
  );
}
