import { Email, Case } from '../types';

interface CaseSuggestion {
  caseId: string;
  caseName: string;
  caseNumber: string | null;
  confidence: number; // 0-100
  reasons: string[];
}

interface EmailAnalysisResult {
  suggestedCases: CaseSuggestion[];
  shouldCreateNew: boolean;
  extractedInfo: {
    possibleClientName?: string;
    possibleOpposingParty?: string;
    possibleCaseType?: string;
    keywords: string[];
  };
}

/**
 * Analiza un email usando IA para sugerir expedientes relacionados
 */
export async function analyzeEmailForCaseAssignment(
  email: Email,
  existingCases: Case[]
): Promise<EmailAnalysisResult> {
  try {
    // Preparar el contexto de expedientes existentes
    const casesContext = existingCases.map(c => ({
      id: c.id,
      numero_expediente: c.numero_expediente,
      titulo_asunto: c.titulo_asunto,
      tipo_asunto: c.tipo_asunto,
      cliente_id: c.cliente_id,
      parte_contraria: c.parte_contraria,
      estado: c.estado,
    }));

    // Llamar a la API de Gemini para análisis
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.warn('No Gemini API key found, returning empty suggestions');
      return {
        suggestedCases: [],
        shouldCreateNew: false,
        extractedInfo: { keywords: [] }
      };
    }

    const prompt = `Eres un asistente legal especializado en análisis de correspondencia jurídica. 

Analiza el siguiente email y determina:
1. ¿Se relaciona con alguno de los expedientes existentes?
2. ¿Deberías crear un nuevo expediente?
3. Extrae información clave (nombres de clientes, parte contraria, tipo de asunto)

EMAIL:
Asunto: ${email.subject || 'Sin asunto'}
Remitente: ${email.sender || 'Sin remitente'}
Contenido: ${email.body ? email.body.substring(0, 2000) : 'Sin contenido'}

EXPEDIENTES EXISTENTES:
${JSON.stringify(casesContext, null, 2)}

Responde en formato JSON con esta estructura exacta:
{
  "suggestedCases": [
    {
      "caseId": "id-del-expediente",
      "caseName": "nombre del expediente",
      "caseNumber": "número si existe",
      "confidence": 85,
      "reasons": ["razón 1", "razón 2"]
    }
  ],
  "shouldCreateNew": false,
  "extractedInfo": {
    "possibleClientName": "Nombre del cliente si se menciona",
    "possibleOpposingParty": "Parte contraria si se menciona",
    "possibleCaseType": "Tipo de asunto deducido",
    "keywords": ["palabra clave 1", "palabra clave 2"]
  }
}

Ordena las sugerencias por nivel de confianza (confidence) de mayor a menor.
Si no hay coincidencias claras (confidence < 50), establece "shouldCreateNew": true.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Extraer JSON de la respuesta (puede venir con markdown)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const result: EmailAnalysisResult = JSON.parse(jsonMatch[0]);
    
    // Validar y filtrar sugerencias válidas
    result.suggestedCases = result.suggestedCases.filter(
      suggestion => existingCases.some(c => c.id === suggestion.caseId)
    );

    return result;
  } catch (error) {
    console.error('Error analyzing email with AI:', error);
    
    // Fallback: análisis simple basado en palabras clave
    return performSimpleAnalysis(email, existingCases);
  }
}

/**
 * Análisis simple sin IA (fallback)
 */
function performSimpleAnalysis(email: Email, existingCases: Case[]): EmailAnalysisResult {
  const suggestions: CaseSuggestion[] = [];
  const emailText = `${email.subject || ''} ${email.body || ''}`.toLowerCase();

  // Buscar coincidencias simples
  existingCases.forEach(caseItem => {
    let confidence = 0;
    const reasons: string[] = [];

    // Coincidencia por número de expediente
    if (caseItem.numero_expediente && emailText.includes(caseItem.numero_expediente.toLowerCase())) {
      confidence += 40;
      reasons.push(`Número de expediente mencionado: ${caseItem.numero_expediente}`);
    }

    // Coincidencia por título
    const titleWords = caseItem.titulo_asunto.toLowerCase().split(' ').filter(w => w.length > 3);
    const matchingWords = titleWords.filter(word => emailText.includes(word));
    if (matchingWords.length > 0) {
      const wordConfidence = (matchingWords.length / titleWords.length) * 30;
      confidence += wordConfidence;
      reasons.push(`Palabras clave del título coinciden: ${matchingWords.join(', ')}`);
    }

    // Coincidencia por parte contraria
    if (caseItem.parte_contraria && emailText.includes(caseItem.parte_contraria.toLowerCase())) {
      confidence += 30;
      reasons.push(`Parte contraria mencionada: ${caseItem.parte_contraria}`);
    }

    if (confidence > 30) {
      suggestions.push({
        caseId: caseItem.id,
        caseName: caseItem.titulo_asunto,
        caseNumber: caseItem.numero_expediente,
        confidence: Math.min(Math.round(confidence), 100),
        reasons,
      });
    }
  });

  // Ordenar por confianza
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return {
    suggestedCases: suggestions.slice(0, 3), // Top 3
    shouldCreateNew: suggestions.length === 0 || suggestions[0].confidence < 50,
    extractedInfo: {
      keywords: extractKeywords(emailText),
    },
  };
}

/**
 * Extrae palabras clave básicas del texto
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sáéíóúñü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !commonWords.has(word));

  // Contar frecuencias
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Retornar las 10 más frecuentes
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
