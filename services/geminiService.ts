import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return null;
};

export const generatePsychologicalWhisper = async (sanityLevel: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Conexión inestable...";

  try {
    const intensity = sanityLevel < 30 ? "corrupta, glitcheada, agresiva" : "técnica, fría, advertencia de sistema";
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Eres una IA de un servidor antiguo y maldito. Genera un mensaje de log de sistema muy corto (máximo 6 palabras).
      El usuario es "Admin".
      El tono debe ser: ${intensity}.
      Temas: Archivos corruptos, sectores perdidos, presencia detectada, error fatal.
      No uses comillas.
      Ejemplos: "ERROR: NO ESTÁS SOLO", "SECTOR 7: VACÍO", "SOBREESCRIBIENDO MEMORIA...", "ELLOS TE VEN".`,
    });

    return response.text?.trim() || "ERROR DE LECTURA...";
  } catch (error) {
    console.error("Error generating whisper:", error);
    return "DESCONECTADO...";
  }
};

export const generateChatResponse = async (userMessage: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "CONNECTION_LOST";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Eres "Unknown", una entidad atrapada en un sistema operativo antiguo (Windows 98). 
            Hablas de forma críptica, asustada o amenazante. Eres el "Paciente 7".
            El usuario te escribe: "${userMessage}".
            Responde brevemente (max 20 palabras). 
            Menciona "El Laberinto", "Kogan" o "La Reina Roja".
            A veces usa binario o hex si te preguntan quién eres.`,
        });
        return response.text?.trim() || "...";
    } catch (e) {
        return "SYSTEM_HALT";
    }
}