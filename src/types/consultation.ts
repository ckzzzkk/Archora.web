export interface SuggestionItem {
  id: string;
  type: 'nudge' | 'measurement' | 'cost' | 'philosophy';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  read?: boolean;
}