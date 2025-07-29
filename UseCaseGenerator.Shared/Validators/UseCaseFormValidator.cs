using FluentValidation;
using UseCaseGenerator.Shared.DTOs;

namespace UseCaseGenerator.Shared.Validators;

public class UseCaseFormValidator : AbstractValidator<UseCaseFormData>
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

    public UseCaseFormValidator()
    {
        RuleFor(x => x.ClientName)
            .NotEmpty()
            .WithMessage("El nombre del cliente es requerido");

        RuleFor(x => x.ProjectName)
            .NotEmpty()
            .WithMessage("El nombre del proyecto es requerido");

        RuleFor(x => x.UseCaseCode)
            .NotEmpty()
            .WithMessage("El código del caso de uso es requerido");

        RuleFor(x => x.UseCaseName)
            .NotEmpty()
            .WithMessage("El nombre del caso de uso es requerido")
            .Must(BeValidInfinitiveVerb)
            .WithMessage("Debe comenzar con un verbo en infinitivo (Gestionar, Crear, Ver, Mostrar, etc.)");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("El nombre del archivo es requerido")
            .Matches(@"^[A-Z]{2}\d{3}.+$")
            .WithMessage("Formato requerido: 2 letras + 3 números + nombre del caso de uso (ej: AB123GestionarUsuarios)");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("La descripción es requerida");

        // Entity-specific validation
        When(x => x.UseCaseType == Models.UseCaseType.Entity, () => {
            RuleFor(x => x.EntityFields)
                .Must(HaveAtLeastOneFieldWithName)
                .WithMessage("Para casos de uso de entidad, debe especificar al menos un campo con nombre");
        });
    }

    private bool BeValidInfinitiveVerb(string useCaseName)
    {
        if (string.IsNullOrEmpty(useCaseName))
            return false;

        return _infinitiveVerbs.Any(verb => 
            useCaseName.ToLower().StartsWith(verb));
    }

    private bool HaveAtLeastOneFieldWithName(List<Models.EntityField> entityFields)
    {
        return entityFields.Any(field => !string.IsNullOrWhiteSpace(field.Name));
    }
}