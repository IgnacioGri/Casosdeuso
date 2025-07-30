import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIGeneratedTagProps {
  isAIGenerated?: boolean;
  className?: string;
}

export function AIGeneratedTag({ isAIGenerated, className }: AIGeneratedTagProps) {
  if (!isAIGenerated) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`text-xs bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1 ${className}`}
    >
      <Sparkles size={10} />
      IA
    </Badge>
  );
}