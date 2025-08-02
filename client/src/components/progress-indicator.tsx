import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  isVisible: boolean;
  progress: number;
  message: string;
  subMessage?: string;
}

export function ProgressIndicator({ isVisible, progress, message, subMessage }: ProgressIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-96 border border-gray-200 dark:border-gray-700 z-50">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{message}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        {subMessage && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subMessage}</p>
        )}
      </div>
    </div>
  );
}