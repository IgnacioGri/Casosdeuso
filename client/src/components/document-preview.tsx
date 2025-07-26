import { useState } from "react";
import { Eye, Edit, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UseCaseFormData, UseCase } from "@/types/use-case";

interface DocumentPreviewProps {
  generatedContent?: string;
  useCase?: UseCase;
  formData?: UseCaseFormData;
  isGenerating?: boolean;
  onEdit?: (instructions: string) => void;
  onExport?: () => void;
}

export default function DocumentPreview({
  generatedContent,
  useCase,
  formData,
  isGenerating = false,
  onEdit,
  onExport
}: DocumentPreviewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleEdit = async () => {
    if (!editInstructions.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese las instrucciones de cambio",
        variant: "destructive"
      });
      return;
    }

    setIsEditing(true);
    try {
      await onEdit?.(editInstructions);
      setShowEditModal(false);
      setEditInstructions('');
      toast({
        title: "Éxito",
        description: "Documento editado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al editar el documento",
        variant: "destructive"
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleExport = async () => {
    try {
      await onExport?.();
      toast({
        title: "Éxito",
        description: "Documento exportado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar el documento",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-sm border border-ms-border sticky top-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="mr-2 text-ms-blue" size={20} />
          Vista Previa
        </h3>
        
        {isGenerating ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-ms-blue mx-auto mb-4" size={32} />
            <p className="text-gray-600">Generando documento...</p>
          </div>
        ) : !generatedContent ? (
          <div className="text-center py-8">
            <Eye className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-600">
              Complete el formulario para ver una vista previa del documento generado.
            </p>
          </div>
        ) : (
          <>
            <div className="flex space-x-2 mb-4">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                <Edit className="mr-1" size={14} />
                Editar
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <Download className="mr-1" size={14} />
                Exportar .docx
              </Button>
            </div>
            
            <div 
              className="text-xs bg-gray-50 p-3 rounded border max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: generatedContent }}
            />
          </>
        )}
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrucciones de cambio
              </label>
              <Textarea 
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                rows={4}
                placeholder="Ej: Agregar una nueva regla de negocio sobre validación de emails..."
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isEditing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEdit}
                disabled={isEditing}
                className="bg-ms-blue hover:bg-ms-blue/90"
              >
                {isEditing && <Loader2 className="animate-spin mr-2" size={16} />}
                Aplicar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
