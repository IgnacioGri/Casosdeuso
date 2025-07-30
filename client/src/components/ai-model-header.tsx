import { Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AIModel } from '@/types/use-case';

interface AIModelHeaderProps {
  currentModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function AIModelHeader({ currentModel, onModelChange }: AIModelHeaderProps) {
  const getModelIcon = (model: AIModel) => {
    switch (model) {
      case 'openai':
        return '🤖';
      case 'claude':
        return '🧠';
      case 'grok':
        return '⚡';
      case 'gemini':
        return '💎';
      case 'demo':
        return '🎯';
      default:
        return '🤖';
    }
  };

  const getModelDescription = (model: AIModel) => {
    switch (model) {
      case 'openai':
        return 'GPT-4o - Balanceado y versátil';
      case 'claude':
        return 'Claude 4.0 - Análisis profundo';
      case 'grok':
        return 'Grok - Rápido y directo';
      case 'gemini':
        return 'Gemini 2.5 - Google AI';
      case 'demo':
        return 'Modo Demo - Sin API';
      default:
        return 'Selecciona un modelo';
    }
  };

  const getModelBadgeVariant = (model: AIModel) => {
    switch (model) {
      case 'openai':
        return 'default';
      case 'claude':
        return 'secondary';
      case 'grok':
        return 'outline';
      case 'gemini':
        return 'default';
      case 'demo':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-ms-blue" />
        <span className="text-sm font-medium text-gray-700">Modelo de IA:</span>
      </div>
      
      <Select value={currentModel} onValueChange={(value: AIModel) => onModelChange(value)}>
        <SelectTrigger className="w-[250px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getModelIcon(currentModel)}</span>
              <Badge variant={getModelBadgeVariant(currentModel)} className="text-xs">
                {currentModel.toUpperCase()}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="demo">
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">🎯</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">Demo</span>
                <span className="text-xs text-gray-500">Modo Demo - Sin API</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="openai">
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">🤖</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">GPT-4o</span>
                <span className="text-xs text-gray-500">Balanceado y versátil</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="claude">
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">🧠</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">Claude 4.0</span>
                <span className="text-xs text-gray-500">Análisis profundo</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="grok">
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">⚡</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">Grok</span>
                <span className="text-xs text-gray-500">Rápido y directo</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="gemini">
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">💎</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">Gemini 2.5</span>
                <span className="text-xs text-gray-500">Google AI</span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="text-xs text-gray-500 max-w-[200px]">
        {getModelDescription(currentModel)}
      </div>
    </div>
  );
}