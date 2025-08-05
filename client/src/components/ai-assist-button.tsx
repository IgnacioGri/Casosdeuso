
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { AdaptiveLoading } from "@/components/adaptive-loading";


interface AIAssistButtonProps {
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  context?: any;
  onImprovement: (improvedValue: string) => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  aiModel?: string;
}

export function AIAssistButton({
  fieldName,
  fieldValue,
  fieldType,
  context,
  onImprovement,
  disabled = false,
  size = "sm",
  variant = "outline",
  aiModel
}: AIAssistButtonProps) {
  const { toast } = useToast();

  const improveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al mejorar el campo');
      }

      return response.json();
    },
    onSuccess: (data) => {
      onImprovement(data.improvedValue);
      toast({
        title: "Campo mejorado",
        description: "El campo ha sido mejorado según las reglas de ING",
      });
    },
    onError: (error) => {
      console.error('Error improving field:', error);
      toast({
        title: "Error",
        description: "No se pudo mejorar el campo. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleImprove = () => {
    improveMutation.mutate({
      fieldName,
      fieldValue,
      fieldType,
      context,
      aiModel
    });
  };

  return (
    <div
      onClick={handleImprove}
      className={`ml-2 whitespace-nowrap cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        disabled || improveMutation.isPending ? 'pointer-events-none opacity-50' : ''
      }`}
      title={`Mejorar "${fieldName}" con IA según reglas ING`}
    >
      {improveMutation.isPending ? (
        <AdaptiveLoading
          context="ai-assist"
          isLoading={true}
          size="sm"
          variant="inline"
        />
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">AI Assist</span>
        </>
      )}
    </div>
  );
}