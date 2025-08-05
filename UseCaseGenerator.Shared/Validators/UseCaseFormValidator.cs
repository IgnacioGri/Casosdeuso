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

    public static ValidationResult ValidateUseCaseFormData(UseCaseFormData formData)
    {
        var result = new ValidationResult();
        
        // SOLO campos básicos obligatorios - Información Básica y Detalles del Caso de Uso
        // El resto son opcionales para flexibilidad en demos en vivo
        
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
            
        // Eliminada la validación obligatoria de campos de entidad para mayor flexibilidad
        // Los campos de entidad, filtros, columnas, etc. ahora son completamente opcionales
            
        return result;
    }

    private static bool BeValidInfinitiveVerb(string useCaseName)
    {
        if (string.IsNullOrEmpty(useCaseName))
            return false;

        // Extract first word from use case name
        var firstWord = useCaseName.Split(' ')[0].ToLower();
        
        // Regex pattern for Spanish infinitive verbs: -ar, -er, -ir endings
        var infinitivePattern = @"^[a-záéíóúñ]+(ar|er|ir)$";
        var regex = new System.Text.RegularExpressions.Regex(infinitivePattern);
        
        // Irregular verbs that don't follow the pattern
        var irregularVerbs = new string[] { "ver", "ser", "ir" };
        
        // Service-oriented verbs for processes (added for parity with React)
        var serviceVerbs = new string[] { 
            "conciliar", "ejecutar", "monitorear", 
            "supervisar", "automatizar" 
        };
        
        // Check if it matches the regex pattern or is an irregular/service verb
        return regex.IsMatch(firstWord) || 
               irregularVerbs.Contains(firstWord) || 
               serviceVerbs.Contains(firstWord);
    }

    private static bool HaveAtLeastOneFieldWithName(List<Models.EntityField> entityFields)
    {
        return entityFields.Any(field => !string.IsNullOrWhiteSpace(field.Name));
    }
}