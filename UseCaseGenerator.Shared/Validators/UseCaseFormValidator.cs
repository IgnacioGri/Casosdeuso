using System.ComponentModel.DataAnnotations;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Shared.Validators;

public class ValidationResult
{
    public List<string> Errors { get; set; } = new();
    public bool IsValid => !Errors.Any();
    
    public void AddError(string error)
    {
        Errors.Add(error);
    }
}

public class UseCaseFormValidator
{
    private readonly string[] _infinitiveVerbs = {
        "gestionar", "crear", "actualizar", "eliminar", "consultar", "registrar", 
        "modificar", "validar", "procesar", "generar", "obtener", "establecer", 
        "configurar", "sincronizar", "enviar", "recibir", "ver", "mostrar", 
        "listar", "buscar", "filtrar", "exportar", "importar", "calcular", 
        "analizar", "reportar", "administrar", "mantener", "controlar", "supervisar",
        "revisar", "aprobar", "rechazar", "autorizar", "denegar", "bloquear",
        "desbloquear", "activar", "desactivar", "habilitar", "deshabilitar",
        "configurar", "parametrizar", "personalizar", "monitorear", "auditar",
        "verificar", "comprobar", "testear", "evaluar", "medir", "documentar",
        "clasificar", "categorizar", "organizar", "ordenar", "priorizar",
        "ejecutar", "implementar", "desarrollar", "construir", "diseñar",
        "planificar", "programar", "automatizar", "optimizar", "mejorar",
        "corregir", "solucionar", "reparar", "restaurar", "recuperar",
        "respaldar", "archivar", "almacenar", "conservar", "preservar",
        "migrar", "transferir", "convertir", "transformar", "adaptar",
        "integrar", "conectar", "sincronizar", "comunicar", "notificar",
        "alertar", "informar", "publicar", "compartir", "distribuir"
    };

    public static ValidationResult ValidateUseCaseFormData(UseCaseFormData formData)
    {
        var result = new ValidationResult();
        
        if (string.IsNullOrEmpty(formData.ClientName))
            result.AddError("El nombre del cliente es requerido");
            
        if (string.IsNullOrEmpty(formData.ProjectName))
            result.AddError("El nombre del proyecto es requerido");
            
        if (string.IsNullOrEmpty(formData.UseCaseCode))
            result.AddError("El código del caso de uso es requerido");
            
        if (string.IsNullOrEmpty(formData.UseCaseName))
            result.AddError("El nombre del caso de uso es requerido");
        else if (!BeValidInfinitiveVerb(formData.UseCaseName))
            result.AddError("Debe comenzar con un verbo en infinitivo (Gestionar, Crear, Ver, Mostrar, etc.)");
            
        if (string.IsNullOrEmpty(formData.FileName))
            result.AddError("El nombre del archivo es requerido");
        else if (!System.Text.RegularExpressions.Regex.IsMatch(formData.FileName, @"^[A-Z]{2}\d{3}.+$"))
            result.AddError("Formato requerido: 2 letras + 3 números + nombre del caso de uso (ej: AB123GestionarUsuarios)");
            
        if (string.IsNullOrEmpty(formData.Description))
            result.AddError("La descripción es requerida");
            
        if (formData.UseCaseType == Models.UseCaseType.Entity && !HaveAtLeastOneFieldWithName(formData.EntityFields))
            result.AddError("Para casos de uso de entidad, debe especificar al menos un campo con nombre");
            
        return result;
    }

    private static bool BeValidInfinitiveVerb(string useCaseName)
    {
        if (string.IsNullOrEmpty(useCaseName))
            return false;

        var infinitiveVerbs = new string[] {
            "gestionar", "crear", "actualizar", "eliminar", "consultar", "registrar", 
            "modificar", "validar", "procesar", "generar", "obtener", "establecer", 
            "configurar", "sincronizar", "enviar", "recibir", "ver", "mostrar", 
            "listar", "buscar", "filtrar", "exportar", "importar", "calcular", 
            "analizar", "reportar", "administrar", "mantener", "controlar", "supervisar"
        };
        
        return infinitiveVerbs.Any(verb => 
            useCaseName.ToLower().StartsWith(verb));
    }

    private static bool HaveAtLeastOneFieldWithName(List<Models.EntityField> entityFields)
    {
        return entityFields.Any(field => !string.IsNullOrWhiteSpace(field.Name));
    }
}