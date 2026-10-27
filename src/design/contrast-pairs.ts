/** Semantic token pairs that must stay readable in both themes. */
export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: string;
}

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: 'text', bg: 'bg', min: 4.5, use: 'Body text' },
  { fg: 'text', bg: 'surface', min: 4.5, use: 'Text on paper' },
  { fg: 'muted', bg: 'bg', min: 4.5, use: 'Secondary text' },
  { fg: 'muted', bg: 'surface', min: 4.5, use: 'Secondary text on paper' },
  { fg: 'brand', bg: 'bg', min: 4.5, use: 'Links' },
  { fg: 'brand', bg: 'surface', min: 4.5, use: 'Links on paper' },
  { fg: 'brand', bg: 'brand-tint', min: 4.5, use: 'Brand badge' },
  { fg: 'on-brand', bg: 'brand-strong', min: 4.5, use: 'Primary button' },
  { fg: 'on-brand', bg: 'brand-strong-hover', min: 4.5, use: 'Primary button hover' },
  { fg: 'teal', bg: 'bg', min: 4.5, use: 'Learning accent text' },
  { fg: 'teal', bg: 'surface', min: 4.5, use: 'Learning accent on paper' },
  { fg: 'teal', bg: 'teal-tint', min: 4.5, use: 'Tip / correct label' },
  { fg: 'text', bg: 'teal-tint', min: 4.5, use: 'Text on tip / correct' },
  { fg: 'on-teal', bg: 'teal-strong', min: 4.5, use: 'Learning button' },
  { fg: 'on-teal', bg: 'teal-strong-hover', min: 4.5, use: 'Learning button hover' },
  { fg: 'danger', bg: 'bg', min: 4.5, use: 'Error text' },
  { fg: 'danger', bg: 'danger-tint', min: 4.5, use: 'Wrong answer label' },
  { fg: 'danger', bg: 'surface', min: 4.5, use: 'Important notice label on paper' },
  { fg: 'stamp', bg: 'bg', min: 4.5, use: '도장 stamp on a quiz result' },
  { fg: 'stamp', bg: 'surface', min: 4.5, use: '도장 stamp on a paper card' },
  { fg: 'text', bg: 'key-mark', min: 4.5, use: 'Key expression over its hatch' },
  { fg: 'text', bg: 'selection', min: 4.5, use: 'Selected text' },
  { fg: 'focus', bg: 'bg', min: 3, use: 'Focus ring' },
  { fg: 'focus', bg: 'surface', min: 3, use: 'Focus ring on paper' },
];
