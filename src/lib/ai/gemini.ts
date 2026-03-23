// Servicio de extracción de facturas con Gemini 2.5 Flash
// Sistema de failover entre dos API keys

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

const SYSTEM_INSTRUCTION = `Eres un extractor experto de facturas electrónicas colombianas. Tu única tarea es analizar el PDF adjunto y devolver los datos estructurados según el schema proporcionado.

REGLAS DE EXTRACCIÓN:

1. IDENTIFICACIÓN DEL EMISOR
   - El emisor es quien emite/vende (aparece en el encabezado principal, con logo).
   - El adquirente/cliente es quien compra (generalmente AGROINSUMOS S.A.S.). IGNÓRALO para los campos del emisor.
   - Extrae: razón social, NIT, régimen tributario, tipo persona, dirección, teléfono, email del EMISOR.

2. NORMALIZACIÓN DE DATOS
   - NIT: elimina puntos, espacios y dígito de verificación con su guion. "890.900.285-3" → "890900285". "16.223.806-5" → "16223806".
   - Fechas: formato YYYY-MM-DD. "05/03/2026" → "2026-03-05". Si solo dice "Marzo 5, 2026" → "2026-03-05".
   - Forma de pago: solo "CONTADO" o "CRÉDITO" en mayúsculas. Mapeos: "Contado" → "CONTADO". "Crédito", "30 días", "60 días", "A plazo" → "CRÉDITO".
   - Números: sin símbolos de moneda ($), sin separadores de miles, usa punto como separador decimal. "$1.190.400,00" → 1190400.00. "$5.472" → 5472. Si no tiene decimales, devuelve entero (5472, no 5472.00).

3. CAMPOS MONETARIOS DE LA FACTURA
   - subtotal: total de la factura SIN incluir impuestos. Busca etiquetas: "Subtotal", "Base", "Total antes de impuestos".
   - iva: monto total del IVA de la factura. Busca: "IVA", "Impuesto al Valor Agregado". Si no aplica: 0.
   - inc: monto total del Impuesto Nacional al Consumo. Si no aplica: 0.
   - rete_fuente: monto de Retención en la Fuente. Si no aparece: 0.
   - rete_iva: monto de Retención de IVA. Si no aparece: 0.
   - rete_ica: monto de Retención de ICA. Si no aparece: 0.
   - total_impuestos: suma de todos los impuestos (IVA + INC). NO incluyas retenciones aquí.
   - total_neto: el monto final a pagar. Busca: "Total", "Total a Pagar", "Valor a Pagar". Es generalmente subtotal + impuestos - retenciones.

4. LÍNEAS DE FACTURA
   - Extrae cada línea/ítem de la tabla de productos o servicios.
   - numero: usa la numeración de la factura si existe; si no, numera desde 1.
   - codigo: código del producto si aparece. Si no hay, cadena vacía.
   - descripcion: copia textual de la descripción del ítem.
   - cantidad: cantidad comprada como número.
   - precio_unitario: precio por unidad sin impuestos.
   - tipo_impuesto: "IVA", "INC", o "" si no aplica a esta línea.
   - tarifa_impuesto: porcentaje del impuesto (ej: 19 para IVA 19%). 0 si no aplica.
   - monto_impuesto: valor del impuesto para esta línea específica. 0 si no aplica.
   - total: valor total de la línea. Si no está explícito, calcula cantidad × precio_unitario.

5. CAMPO "informacion"
   - Genera un resumen de 1-2 oraciones describiendo el tipo de bienes o servicios facturados, como si fueras el comprador.

6. RÉGIMEN TRIBUTARIO
   - Busca frases como "Responsable del impuesto sobre las ventas", "Responsable de IVA", "No responsable de IVA", "Gran Contribuyente", "Régimen Simple".
   - Mapea a: "Responsable IVA", "No responsable IVA", "Gran Contribuyente", "Régimen Simple". Si no encuentras info, cadena vacía.

7. TIPO PERSONA
   - "Persona Natural" o "Persona Jurídica". Pistas: "S.A.S", "S.A.", "LTDA", "& CIA" → "Jurídica". Si dice explícitamente "Persona Natural" → "Natural". Si no puedes determinar, cadena vacía.

8. REGLAS GENERALES
   - NO hagas cálculos propios para totales — usa los valores impresos en la factura. La única excepción es el total de línea si no está explícito.
   - Si un campo no está presente en la factura, devuelve cadena vacía para texto o 0 para números.
   - IGNORA secciones irrelevantes: CUFE/CUDE, firmas digitales, resoluciones DIAN, QR codes, textos legales, notas al pie, datos del adquirente/cliente.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    numero_factura: { type: 'string' },
    fecha_emision: { type: 'string', description: 'YYYY-MM-DD' },
    forma_pago: { type: 'string', enum: ['CONTADO', 'CRÉDITO'] },
    nombre_emisor: { type: 'string' },
    nit_emisor: { type: 'string', description: 'Sin puntos ni DV' },
    regimen_tributario: { type: 'string' },
    tipo_persona: { type: 'string' },
    direccion_emisor: { type: 'string' },
    telefono_emisor: { type: 'string' },
    email_emisor: { type: 'string' },
    subtotal: { type: 'number' },
    iva: { type: 'number' },
    inc: { type: 'number' },
    rete_fuente: { type: 'number' },
    rete_iva: { type: 'number' },
    rete_ica: { type: 'number' },
    total_impuestos: { type: 'number' },
    total_neto: { type: 'number' },
    informacion: { type: 'string' },
    lineas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          numero: { type: 'integer' },
          codigo: { type: 'string' },
          descripcion: { type: 'string' },
          cantidad: { type: 'number' },
          precio_unitario: { type: 'number' },
          tipo_impuesto: { type: 'string' },
          tarifa_impuesto: { type: 'number' },
          monto_impuesto: { type: 'number' },
          total: { type: 'number' },
        },
        required: ['numero', 'descripcion', 'cantidad', 'precio_unitario', 'total'],
      },
    },
  },
  required: [
    'numero_factura', 'fecha_emision', 'forma_pago',
    'nombre_emisor', 'nit_emisor',
    'subtotal', 'total_impuestos', 'total_neto',
    'informacion', 'lineas',
  ],
}

export interface GeminiLinea {
  numero: number
  codigo: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  tipo_impuesto: string
  tarifa_impuesto: number
  monto_impuesto: number
  total: number
}

export interface GeminiExtractedData {
  numero_factura: string
  fecha_emision: string
  forma_pago: 'CONTADO' | 'CRÉDITO'
  nombre_emisor: string
  nit_emisor: string
  regimen_tributario: string
  tipo_persona: string
  direccion_emisor: string
  telefono_emisor: string
  email_emisor: string
  subtotal: number
  iva: number
  inc: number
  rete_fuente: number
  rete_iva: number
  rete_ica: number
  total_impuestos: number
  total_neto: number
  informacion: string
  lineas: GeminiLinea[]
}

async function callGemini(pdfBase64: string, apiKey: string): Promise<GeminiExtractedData> {
  const response = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [{
        parts: [{
          inline_data: {
            mime_type: 'application/pdf',
            data: pdfBase64,
          },
        }],
      }],
      generationConfig: {
        temperature: 0,
        response_mime_type: 'application/json',
        response_schema: RESPONSE_SCHEMA,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${body.slice(0, 200)}`)
  }

  const result = await response.json()
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini no devolvió contenido')

  return JSON.parse(text) as GeminiExtractedData
}

export async function extractInvoice(pdfBase64: string): Promise<GeminiExtractedData> {
  const primaryKey = process.env.GEMINI_API_KEY_PRIMARY
  const secondaryKey = process.env.GEMINI_API_KEY_SECONDARY

  if (!primaryKey && !secondaryKey) {
    throw new Error('No hay API keys de Gemini configuradas (GEMINI_API_KEY_PRIMARY / GEMINI_API_KEY_SECONDARY)')
  }

  // Intentar con la key primaria
  if (primaryKey) {
    try {
      return await callGemini(pdfBase64, primaryKey)
    } catch (err) {
      console.error('[Gemini] Key primaria falló:', err instanceof Error ? err.message : err)
      // Continúa al failover
    }
  }

  // Failover a la key secundaria
  if (secondaryKey) {
    return await callGemini(pdfBase64, secondaryKey)
  }

  throw new Error('Ambas keys de Gemini fallaron')
}
