'use client';

import React from 'react';
import { MentionsInput as ReactMentionsInput, Mention, type SuggestionDataItem } from 'react-mentions';
import type { Suggestion } from '@/components/ui/tag-input';

interface MentionProps {
  id: string;
  value: string;
  onChange: (event: any, newValue: string, newPlainTextValue: string, mentions: any[]) => void;
  suggestions: Suggestion[];
  placeholder?: string;
}

interface MentionInputProps extends MentionProps {}
interface MentionTextareaProps extends MentionProps {}


const BaseMentionEditor: React.FC<MentionProps & { singleLine?: boolean }> = ({ id, value, onChange, suggestions, placeholder, singleLine = false }) => {
    
  const mentionSuggestions: SuggestionDataItem[] = suggestions.map(s => ({
    id: s.value,
    display: s.value,
  }));

  return (
    <div className="mentions">
      <ReactMentionsInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        singleLine={singleLine}
        className="mentions"
      >
        <Mention
          trigger="@"
          data={mentionSuggestions}
          markup="{{__display__}}"
          className="mentions__mention"
          appendSpaceOnAdd
        />
        <Mention
          trigger="/"
          data={mentionSuggestions}
          markup="{{__display__}}"
          className="mentions__mention"
          appendSpaceOnAdd
        />
      </ReactMentionsInput>
    </div>
  );
};


export const MentionInput: React.FC<MentionInputProps> = (props) => {
    return <BaseMentionEditor {...props} singleLine={true} />;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = (props) => {
    return <BaseMentionEditor {...props} singleLine={false} />;
}
