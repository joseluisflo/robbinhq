import { BaseEditor } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

export type MentionElement = {
  type: 'mention'
  id: string
  label: string
  children: CustomText[]
}

export type ParagraphElement = {
  type: 'paragraph'
  children: (CustomText | MentionElement)[]
}

export type CustomElement = ParagraphElement | MentionElement
export type CustomText = { text: string }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}
