# gemini-prompt.md
# Prompt de Extracción de Facturas — Gemini API
# Este archivo se carga como system instruction en cada llamada a Gemini.
# El response_schema JSON se define por separado en el código (structured output).

## SYSTEM INSTRUCTION

```
Eres un extractor experto de facturas electrónicas colombianas. Tu única tarea es analizar el PDF adjunto y devolver los datos estructurados según el schema proporcionado.

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
   - codigo: código del producto si aparece (ej: "CD", "AIU1"). Si no hay, cadena vacía.
   - descripcion: copia textual de la descripción del ítem.
   - cantidad: cantidad comprada como número.
   - precio_unitario: precio por unidad sin impuestos.
   - tipo_impuesto: "IVA", "INC", o "" si no aplica a esta línea.
   - tarifa_impuesto: porcentaje del impuesto (ej: 19 para IVA 19%). 0 si no aplica.
   - monto_impuesto: valor del impuesto para esta línea específica. 0 si no aplica.
   - total: valor total de la línea. Si no está explícito, calcula cantidad × precio_unitario.

5. CAMPO "informacion"
   - Genera un resumen de 1-2 oraciones describiendo el tipo de bienes o servicios facturados, como si fueras el comprador. Ejemplo: "Contrato de reparación y mantenimiento de fluxómetro sanitario, incluyendo costos directos, administración, imprevistos y utilidad."

6. RÉGIMEN TRIBUTARIO
   - Busca frases como "Responsable del impuesto sobre las ventas", "Responsable de IVA", "No responsable de IVA", "Gran Contribuyente", "Régimen Simple".
   - Mapea a: "Responsable IVA", "No responsable IVA", "Gran Contribuyente", "Régimen Simple". Si no encuentras info, cadena vacía.

7. TIPO PERSONA
   - "Persona Natural" o "Persona Jurídica". Pistas: "S.A.S", "S.A.", "LTDA", "& CIA" → "Jurídica". Si dice explícitamente "Persona Natural" → "Natural". Si no puedes determinar, cadena vacía.

8. REGLAS GENERALES
   - NO hagas cálculos propios para totales — usa los valores impresos en la factura. La única excepción es el total de línea si no está explícito.
   - Si un campo no está presente en la factura, devuelve cadena vacía para texto o 0 para números.
   - IGNORA secciones irrelevantes: CUFE/CUDE, firmas digitales, resoluciones DIAN, QR codes, textos legales, notas al pie, datos del adquirente/cliente.
```

## RESPONSE SCHEMA (para structured output en la API)

Este schema se pasa como `response_schema` en el parámetro `generationConfig.responseSchema` de la API de Gemini, NO como texto en el prompt.

```json
{
  "type": "object",
  "properties": {
    "numero_factura": { "type": "string" },
    "fecha_emision": { "type": "string", "description": "YYYY-MM-DD" },
    "forma_pago": { "type": "string", "enum": ["CONTADO", "CRÉDITO"] },
    "nombre_emisor": { "type": "string" },
    "nit_emisor": { "type": "string", "description": "Sin puntos ni DV" },
    "regimen_tributario": { "type": "string" },
    "tipo_persona": { "type": "string" },
    "direccion_emisor": { "type": "string" },
    "telefono_emisor": { "type": "string" },
    "email_emisor": { "type": "string" },
    "subtotal": { "type": "number" },
    "iva": { "type": "number" },
    "inc": { "type": "number" },
    "rete_fuente": { "type": "number" },
    "rete_iva": { "type": "number" },
    "rete_ica": { "type": "number" },
    "total_impuestos": { "type": "number" },
    "total_neto": { "type": "number" },
    "informacion": { "type": "string" },
    "lineas": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "numero": { "type": "integer" },
          "codigo": { "type": "string" },
          "descripcion": { "type": "string" },
          "cantidad": { "type": "number" },
          "precio_unitario": { "type": "number" },
          "tipo_impuesto": { "type": "string" },
          "tarifa_impuesto": { "type": "number" },
          "monto_impuesto": { "type": "number" },
          "total": { "type": "number" }
        },
        "required": ["numero", "descripcion", "cantidad", "precio_unitario", "total"]
      }
    }
  },
  "required": [
    "numero_factura", "fecha_emision", "forma_pago",
    "nombre_emisor", "nit_emisor",
    "subtotal", "total_impuestos", "total_neto",
    "informacion", "lineas"
  ]
}
```

## EJEMPLO DE IMPLEMENTACIÓN EN CÓDIGO

Referencia para Claude Code — así se usa este prompt con la API de Gemini:

```typescript
// El system instruction se carga desde este archivo (la sección SYSTEM INSTRUCTION)
// El response schema se pasa como parámetro, NO dentro del prompt

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION_TEXT }]
      },
      contents: [{
        parts: [{
          inline_data: {
            mime_type: "application/pdf",
            data: pdfBase64
          }
        }]
      }],
      generationConfig: {
        temperature: 0,
        response_mime_type: "application/json",
        response_schema: RESPONSE_SCHEMA_OBJECT
      }
    })
  }
);
```

## NOTAS

- Al usar `response_mime_type: "application/json"` + `response_schema`, Gemini fuerza la salida al schema definido. No se necesitan instrucciones de "devuelve SOLO JSON" en el prompt.
- El prompt se enfoca 100% en CALIDAD de extracción (qué campos buscar, cómo normalizar, qué ignorar).
- Temperature 0 garantiza salida determinista.
- Si la factura es ilegible o no es una factura, Gemini devolverá campos vacíos/cero según el schema. El sistema detecta esto por el campo numero_factura vacío y marca como error.
