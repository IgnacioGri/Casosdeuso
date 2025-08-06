import { Brain, Settings, Bot, Sparkles, Zap, Gem, Monitor, PlayCircle } from 'lucide-react';
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
    const iconClass = "h-4 w-4 text-violet-600";
    switch (model) {
      case 'openai':
        return <Bot className={iconClass} />;
      case 'claude':
        return <Brain className={iconClass} />;
      case 'grok':
        return <Zap className={iconClass} />;
      case 'gemini':
        return <Gem className={iconClass} />;
      case 'copilot':
        return <Monitor className={iconClass} />;
      case 'demo':
        return <PlayCircle className={iconClass} />;
      default:
        return <Bot className={iconClass} />;
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
      case 'copilot':
        return 'Microsoft Copilot - Empresarial';
      case 'demo':
        return 'Modo Demo - Sin API';
      default:
        return 'Selecciona un modelo';
    }
  };

  const getModelBadgeVariant = (model: AIModel) => {
    // Todos los modelos ahora usan el fondo violeta (default) por preferencia del usuario
    return 'default' as const;
  };

  return (
    <div className="flex items-center gap-4 ai-model-header">
      <Select value={currentModel} onValueChange={(value: AIModel) => onModelChange(value)}>
        <SelectTrigger className="w-[250px] h-12 border-violet-300 focus:border-violet-500 focus:ring-violet-500">
          <SelectValue>
            <div className="flex items-center gap-2">
              {getModelIcon(currentModel)}
              <Badge variant={getModelBadgeVariant(currentModel)} className="text-xs bg-violet-100 text-violet-700 border-violet-300">
                {currentModel.toUpperCase()}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="demo">
            <div className="flex items-center gap-3 w-full">
              <PlayCircle className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Demo</span>
                <span className="text-xs text-gray-500">Modo Demo - Sin API</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="openai">
            <div className="flex items-center gap-3 w-full">
              <Bot className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">GPT-4o</span>
                <span className="text-xs text-gray-500">Balanceado y versátil</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="claude">
            <div className="flex items-center gap-3 w-full">
              <Brain className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Claude 4.0</span>
                <span className="text-xs text-gray-500">Análisis profundo</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="grok">
            <div className="flex items-center gap-3 w-full">
              <Zap className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Grok</span>
                <span className="text-xs text-gray-500">Rápido y directo</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="gemini">
            <div className="flex items-center gap-3 w-full">
              <Gem className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Gemini 2.5</span>
                <span className="text-xs text-gray-500">Google AI</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="copilot">
            <div className="flex items-center gap-3 w-full">
              <Monitor className="h-4 w-4 text-violet-600" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Microsoft Copilot</span>
                <span className="text-xs text-gray-500">Microsoft Copilot - Empresarial</span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}