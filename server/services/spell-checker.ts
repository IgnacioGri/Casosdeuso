/**
 * Spell checker service for selective accent correction
 * Focuses on common Spanish words that frequently miss accents
 * Does NOT modify technical terms, abbreviations, or codes
 */

interface SpellCheckRule {
  incorrect: string;
  correct: string;
  context?: 'word-boundary' | 'anywhere';
}

// Common Spanish words that frequently miss accents
const ACCENT_CORRECTIONS: SpellCheckRule[] = [
  // Common business/banking terms
  { incorrect: 'descripcion', correct: 'descripción', context: 'word-boundary' },
  { incorrect: 'operacion', correct: 'operación', context: 'word-boundary' },
  { incorrect: 'informacion', correct: 'información', context: 'word-boundary' },
  { incorrect: 'validacion', correct: 'validación', context: 'word-boundary' },
  { incorrect: 'autenticacion', correct: 'autenticación', context: 'word-boundary' },
  { incorrect: 'autorizacion', correct: 'autorización', context: 'word-boundary' },
  { incorrect: 'transaccion', correct: 'transacción', context: 'word-boundary' },
  { incorrect: 'configuracion', correct: 'configuración', context: 'word-boundary' },
  { incorrect: 'administracion', correct: 'administración', context: 'word-boundary' },
  { incorrect: 'gestion', correct: 'gestión', context: 'word-boundary' },
  { incorrect: 'creacion', correct: 'creación', context: 'word-boundary' },
  { incorrect: 'modificacion', correct: 'modificación', context: 'word-boundary' },
  { incorrect: 'eliminacion', correct: 'eliminación', context: 'word-boundary' },
  { incorrect: 'integracion', correct: 'integración', context: 'word-boundary' },
  { incorrect: 'notificacion', correct: 'notificación', context: 'word-boundary' },
  { incorrect: 'verificacion', correct: 'verificación', context: 'word-boundary' },
  { incorrect: 'confirmacion', correct: 'confirmación', context: 'word-boundary' },
  { incorrect: 'cancelacion', correct: 'cancelación', context: 'word-boundary' },
  { incorrect: 'actualizacion', correct: 'actualización', context: 'word-boundary' },
  { incorrect: 'revision', correct: 'revisión', context: 'word-boundary' },
  { incorrect: 'sesion', correct: 'sesión', context: 'word-boundary' },
  { incorrect: 'usuario', correct: 'usuario', context: 'word-boundary' }, // This one is correct, keeping for completeness
  
  // Common verbs in infinitive (frequently used in use cases)
  { incorrect: 'verificar', correct: 'verificar', context: 'word-boundary' }, // Already correct
  { incorrect: 'validar', correct: 'validar', context: 'word-boundary' }, // Already correct
  { incorrect: 'procesar', correct: 'procesar', context: 'word-boundary' }, // Already correct
  
  // Time and date related
  { incorrect: 'ejecucion', correct: 'ejecución', context: 'word-boundary' },
  { incorrect: 'programacion', correct: 'programación', context: 'word-boundary' },
  { incorrect: 'planificacion', correct: 'planificación', context: 'word-boundary' },
  
  // Common adjectives
  { incorrect: 'automatico', correct: 'automático', context: 'word-boundary' },
  { incorrect: 'automatica', correct: 'automática', context: 'word-boundary' },
  { incorrect: 'electronico', correct: 'electrónico', context: 'word-boundary' },
  { incorrect: 'electronica', correct: 'electrónica', context: 'word-boundary' },
  { incorrect: 'publico', correct: 'público', context: 'word-boundary' },
  { incorrect: 'publica', correct: 'pública', context: 'word-boundary' },
  { incorrect: 'basico', correct: 'básico', context: 'word-boundary' },
  { incorrect: 'basica', correct: 'básica', context: 'word-boundary' },
  { incorrect: 'logico', correct: 'lógico', context: 'word-boundary' },
  { incorrect: 'logica', correct: 'lógica', context: 'word-boundary' },
  { incorrect: 'tecnico', correct: 'técnico', context: 'word-boundary' },
  { incorrect: 'tecnica', correct: 'técnica', context: 'word-boundary' },
  { incorrect: 'practico', correct: 'práctico', context: 'word-boundary' },
  { incorrect: 'practica', correct: 'práctica', context: 'word-boundary' },
  
  // Common nouns
  { incorrect: 'sistema', correct: 'sistema', context: 'word-boundary' }, // Already correct
  { incorrect: 'metodo', correct: 'método', context: 'word-boundary' },
  { incorrect: 'codigo', correct: 'código', context: 'word-boundary' },
  { incorrect: 'numero', correct: 'número', context: 'word-boundary' },
  { incorrect: 'telefono', correct: 'teléfono', context: 'word-boundary' },
  { incorrect: 'direccion', correct: 'dirección', context: 'word-boundary' },
  { incorrect: 'ubicacion', correct: 'ubicación', context: 'word-boundary' },
  { incorrect: 'razon', correct: 'razón', context: 'word-boundary' },
  { incorrect: 'organizacion', correct: 'organización', context: 'word-boundary' },
  { incorrect: 'institucion', correct: 'institución', context: 'word-boundary' },
  { incorrect: 'solucion', correct: 'solución', context: 'word-boundary' },
  { incorrect: 'funcion', correct: 'función', context: 'word-boundary' },
  { incorrect: 'opcion', correct: 'opción', context: 'word-boundary' },
  { incorrect: 'situacion', correct: 'situación', context: 'word-boundary' },
  { incorrect: 'condicion', correct: 'condición', context: 'word-boundary' },
  { incorrect: 'posicion', correct: 'posición', context: 'word-boundary' },
  { incorrect: 'relacion', correct: 'relación', context: 'word-boundary' },
  { incorrect: 'aplicacion', correct: 'aplicación', context: 'word-boundary' },
  { incorrect: 'comunicacion', correct: 'comunicación', context: 'word-boundary' },
  { incorrect: 'presentacion', correct: 'presentación', context: 'word-boundary' },
  { incorrect: 'documentacion', correct: 'documentación', context: 'word-boundary' },
  
  // Banking specific terms
  { incorrect: 'transferencia', correct: 'transferencia', context: 'word-boundary' }, // Already correct
  { incorrect: 'cuenta', correct: 'cuenta', context: 'word-boundary' }, // Already correct
  { incorrect: 'deposito', correct: 'depósito', context: 'word-boundary' },
  { incorrect: 'credito', correct: 'crédito', context: 'word-boundary' },
  { incorrect: 'debito', correct: 'débito', context: 'word-boundary' },
  { incorrect: 'comision', correct: 'comisión', context: 'word-boundary' },
  { incorrect: 'interes', correct: 'interés', context: 'word-boundary' },
  { incorrect: 'periodo', correct: 'período', context: 'word-boundary' },
  { incorrect: 'prestamo', correct: 'préstamo', context: 'word-boundary' },
  { incorrect: 'garantia', correct: 'garantía', context: 'word-boundary' },
  
  // Pronouns and articles that commonly lose accents
  { incorrect: ' el ', correct: ' él ', context: 'anywhere' }, // Only when it should be the pronoun
  { incorrect: ' tu ', correct: ' tú ', context: 'anywhere' }, // Only when it should be the pronoun
  { incorrect: ' mi ', correct: ' mí ', context: 'anywhere' }, // Only when it should be the pronoun
  { incorrect: ' si ', correct: ' sí ', context: 'anywhere' }, // Only when it should be "yes"
];

// Technical terms, abbreviations, and codes that should NEVER be modified
const EXCLUSION_PATTERNS = [
  // Banking codes and abbreviations
  /\b[A-Z]{2,}\b/, // All caps abbreviations (CBU, CUIT, DNI, API, etc.)
  /\b[A-Z]{2}\d{3}\b/, // Code patterns like ST003, BP001
  /\b\w+\d+\b/, // Words with numbers (cuenta1, dato1, etc.)
  /\b\d+\w*\b/, // Numbers with letters (2FA, 3DES, etc.)
  
  // Technical terms (English/Mixed)
  /\b(endpoint|token|timestamp|payload|response|request|callback|webhook)\b/i,
  /\b(username|password|login|logout|signup|email|url|uri|http|https)\b/i,
  /\b(json|xml|html|css|javascript|sql|api|rest|soap|oauth)\b/i,
  
  // File extensions and technical formats
  /\.\w{2,4}\b/, // .docx, .json, .xml, etc.
  
  // Compound technical words
  /\b\w+[A-Z]\w+\b/, // camelCase words (fechaCreacion, montoMaximo, etc.)
  /\b\w+_\w+\b/, // snake_case words
  /\b\w+-\w+\b/, // hyphenated words
  
  // Database/field names
  /\bid\w*\b/i, // id, idCliente, idOperacion, etc.
  /\b\w*(Id|ID)\b/, // clienteId, operacionID, etc.
];

export class SpellChecker {
  
  /**
   * Applies selective accent correction to text
   * Only corrects common Spanish words, preserves technical terms
   */
  static correctAccents(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    let correctedText = text;
    
    // Apply each correction rule
    for (const rule of ACCENT_CORRECTIONS) {
      // Skip if this word/phrase should be excluded
      if (this.shouldExclude(rule.incorrect, correctedText)) {
        continue;
      }
      
      let regex: RegExp;
      
      if (rule.context === 'word-boundary') {
        // Only match complete words (not parts of other words)
        regex = new RegExp(`\\b${this.escapeRegex(rule.incorrect)}\\b`, 'gi');
      } else {
        // Match anywhere in text
        regex = new RegExp(this.escapeRegex(rule.incorrect), 'gi');
      }
      
      correctedText = correctedText.replace(regex, (match) => {
        // Preserve original case
        return this.preserveCase(match, rule.correct);
      });
    }
    
    return correctedText;
  }
  
  /**
   * Check if a word should be excluded from correction
   */
  private static shouldExclude(word: string, context: string): boolean {
    // Find the word in context to check surrounding characters
    const wordRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
    const matches = Array.from(context.matchAll(wordRegex));
    
    for (const match of matches) {
      const matchText = match[0];
      const startIndex = match.index!;
      const endIndex = startIndex + matchText.length;
      
      // Get surrounding context (20 characters before and after)
      const beforeContext = context.substring(Math.max(0, startIndex - 20), startIndex);
      const afterContext = context.substring(endIndex, Math.min(context.length, endIndex + 20));
      const fullContext = beforeContext + matchText + afterContext;
      
      // Check against exclusion patterns
      for (const pattern of EXCLUSION_PATTERNS) {
        if (pattern.test(fullContext)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Escape special regex characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * Preserve the original case when replacing
   */
  private static preserveCase(original: string, replacement: string): string {
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    return replacement.toLowerCase();
  }
  
  /**
   * Check if text contains any technical terms that might need protection
   */
  static containsTechnicalTerms(text: string): boolean {
    return EXCLUSION_PATTERNS.some(pattern => pattern.test(text));
  }
  
  /**
   * Get a summary of what would be corrected (for debugging/preview)
   */
  static getCorrectionsPreview(text: string): Array<{ original: string; corrected: string }> {
    const corrections: Array<{ original: string; corrected: string }> = [];
    
    for (const rule of ACCENT_CORRECTIONS) {
      if (this.shouldExclude(rule.incorrect, text)) {
        continue;
      }
      
      const regex = rule.context === 'word-boundary' 
        ? new RegExp(`\\b${this.escapeRegex(rule.incorrect)}\\b`, 'gi')
        : new RegExp(this.escapeRegex(rule.incorrect), 'gi');
      
      const matches = Array.from(text.matchAll(regex));
      for (const match of matches) {
        corrections.push({
          original: match[0],
          corrected: this.preserveCase(match[0], rule.correct)
        });
      }
    }
    
    return corrections;
  }
}