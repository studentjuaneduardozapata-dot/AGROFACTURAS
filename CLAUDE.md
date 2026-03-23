# CLAUDE.md — FacturIA (AGROFACTURAS)
## Fuente de verdad del proyecto. Leer al inicio de cada sesión.

---

## ¿Qué es este proyecto?

Plataforma web SaaS para AGROINSUMOS SAS que ingesta facturas electrónicas colombianas en PDF,
extrae datos con IA (Gemini), permite validación humana, distribuye centros de costo, genera
órdenes de compra en PDF y ofrece seguimiento de créditos y dashboard de análisis.

---

## Stack tecnológico

| Componente        | Tecnología                   | Versión  |
|-------------------|------------------------------|----------|
| Framework         | Next.js (App Router)         | 15.5.14  |
| Lenguaje          | TypeScript                   | ^5       |
| Estilos           | Tailwind CSS                 | ^4       |
| Componentes UI    | shadcn/ui                    | 4.1.0    |
| Base de datos     | Supabase (PostgreSQL)        | latest   |
| Auth              | Supabase Auth (email/pass)   | —        |
| Storage           | Supabase Storage             | —        |
| IA                | Google Gemini 2.5 Flash      | Fase 2   |
| Runtime           | Node.js                      | v24.13   |

### Colores corporativos
- Verde principal: `#6ab04c` → `oklch(0.658 0.148 144)`
- Verde oscuro:   `#4a8a35` → `oklch(0.527 0.138 144)`
- Verde claro:    `#eaf5e4` → `oklch(0.965 0.033 144)`

---

## Estructura de carpetas

```
AGROFACTURAS/
├── CLAUDE.md                     ← Este archivo
├── .env.local.example            ← Variables de entorno requeridas
├── docs/
│   ├── gemini-prompt.md          ← System instruction + responseSchema Gemini
│   └── Formato_Orden_De_Compra.pdf ← Plantilla visual OC (referencia)
├── public/
│   └── logo.svg                  ← Logo Agroinsumos
├── supabase/
│   ├── schema.sql                ← Schema completo (ejecutar en Supabase)
│   └── seed.sql                  ← Datos iniciales (ejecutar después de schema)
└── src/
    ├── middleware.ts              ← Auth guard (protege todas las rutas)
    ├── app/
    │   ├── layout.tsx            ← Root layout (metadata, Toaster)
    │   ├── globals.css           ← Tema Tailwind v4 + colores shadcn/ui
    │   ├── (auth)/
    │   │   ├── layout.tsx        ← Layout centrado para login
    │   │   └── login/page.tsx    ← Página de login
    │   └── (dashboard)/
    │       ├── layout.tsx        ← Sidebar + Topbar (verifica auth)
    │       ├── page.tsx          ← Dashboard (KPIs en Fase 3)
    │       ├── facturas/         ← M1+M2+M3+M4 (Fase 2)
    │       ├── proveedores/      ← M5 (Fase 2)
    │       ├── creditos/         ← M8 (Fase 3)
    │       └── configuracion/    ← M10 (Fase 1 ✅ COMPLETO)
    │           ├── page.tsx
    │           └── _components/
    │               ├── centros-costo-tab.tsx
    │               ├── datos-empresa-tab.tsx
    │               ├── solicitante-tab.tsx
    │               ├── centro-form-dialog.tsx
    │               └── sub-centro-form-dialog.tsx
    ├── components/
    │   ├── app-sidebar.tsx       ← Sidebar de navegación
    │   ├── topbar.tsx            ← Barra superior
    │   └── ui/                  ← Componentes shadcn/ui (auto-generados)
    └── lib/
        ├── supabase/
        │   ├── client.ts         ← Browser client
        │   ├── server.ts         ← Server client (async cookies)
        │   ├── middleware.ts     ← Middleware client (refresh token)
        │   └── types.ts         ← Tipos TypeScript del schema
        └── actions/
            ├── auth.ts           ← login(), logout()
            └── configuracion.ts  ← CRUD centros, sub-centros, config
```

---

## Schema de base de datos

### Tablas principales

| Tabla                | Descripción                                        | Estado   |
|----------------------|----------------------------------------------------|----------|
| `configuracion`      | Config empresa, solicitante, autorizador (JSONB)   | ✅ Creada |
| `centros_costo`      | Centros de costo disponibles                       | ✅ Creada |
| `sub_centros`        | Sub-centros por centro de costo (FK)               | ✅ Creada |
| `proveedores`        | Proveedores con memoria de configuraciones         | ✅ Creada |
| `facturas`           | Facturas electrónicas procesadas                   | ✅ Creada |
| `lineas_factura`     | Líneas/ítems de cada factura (FK)                  | ✅ Creada |
| `distribuciones_costo` | Distribución de costos (máx 5 por factura)       | ✅ Creada |
| `ordenes_compra`     | OC generadas 1:1 con facturas                      | ✅ Creada |
| `log_procesamiento`  | Auditoría de eventos de procesamiento              | ✅ Creada |

### Restricciones clave
- `distribuciones_costo`: máx 5 centros por factura (trigger DB), suma = 100% (validación app)
- `facturas`: UNIQUE(proveedor_id, numero_factura) para deduplicación lógica
- `facturas`: hash_pdf UNIQUE para deduplicación por contenido
- RLS habilitado en todas las tablas: `auth.role() = 'authenticated'`

### Triggers
- `actualizar_updated_at()` → proveedores, configuracion
- `validar_distribucion_porcentaje()` → distribuciones_costo (≤ 100%, máx 5 filas)

### Función SQL
- `generar_numero_oc()` → Genera formato AI-YY-NNN

---

## Variables de entorno

```bash
# Requeridas desde Fase 1
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Requeridas desde Fase 2
GEMINI_API_KEY_PRIMARY=tu-key-primaria
GEMINI_API_KEY_SECONDARY=tu-key-secundaria
```

---

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo (localhost:3000)
npm run build        # Build de producción
npm run lint         # Linter ESLint

# Regenerar tipos TypeScript desde Supabase (requiere: npx supabase login)
npx supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/lib/supabase/types.ts
```

---

## Módulos y estado

| ID  | Módulo                           | Estado      | Fase |
|-----|----------------------------------|-------------|------|
| M10 | Configuración                    | ✅ Completo  | 1    |
| M-IA| Servicio Gemini con failover     | ⏳ Pendiente | 2    |
| M1  | Ingesta de documentos            | ⏳ Pendiente | 2    |
| M2  | Validación Human-in-the-Loop     | ⏳ Pendiente | 2    |
| M3  | Distribución de Centros de Costo | ⏳ Pendiente | 2    |
| M4  | Concepto y Categoría             | ⏳ Pendiente | 2    |
| M5  | Gestión de Proveedores           | ⏳ Pendiente | 2    |
| M6  | Generación de Orden de Compra    | ⏳ Pendiente | 3    |
| M7  | Sistema de Impresión             | ⏳ Pendiente | 3    |
| M8  | Seguimiento de Créditos          | ⏳ Pendiente | 3    |
| M9  | Dashboard                        | ⏳ Pendiente | 3    |

---

## Datos de la empresa (configuración)

Almacenados en tabla `configuracion` con clave `datos_empresa`:
- Nombre: AGROINSUMOS SAS
- NIT: 836 000 548 - 7
- Dirección: Calle 13 # 56-20 barrio villa Daniel - Zaragoza
- Ciudad: Cartago - Valle
- Correo: f.electronica@agroinsumossa.com
- Teléfono: (602) 214 99 10

Solicitante default (clave `solicitante_default`):
- Andres Felipe Celis Bernal, Jefe De Planta, andres.celis@agroinsumossa.com

Autorizador default (clave `autorizador_default`):
- Juan Esteban Castaño

---

## Decisiones técnicas

| Decisión                   | Elección                  | Razón                                              |
|----------------------------|---------------------------|----------------------------------------------------|
| Mutaciones de datos        | Server Actions            | Idiomatic App Router, elimina API routes           |
| Config empresa             | Tabla `configuracion`     | Editable en runtime, no hardcoded                  |
| Distribución %             | ≤100 en DB, ==100 en app  | Permite inserción incremental de filas             |
| Máx centros por factura    | 5 (trigger DB + UI)       | Restricción de negocio                             |
| Auth                       | Supabase Auth email/pass  | Sin registro público, usuarios creados manualmente |
| Estado global cliente      | Sin store (Fase 1)        | Server Components suficientes                      |
| Tailwind                   | v4 (CSS-first)            | Auto-instalado por create-next-app@15              |
| Tipos Supabase             | Manuales (placeholder)    | Regenerar con CLI cuando tengas project-id         |

---

## Gemini (Fase 2)

Ver `docs/gemini-prompt.md` para:
- System instruction completa (extracción de facturas colombianas)
- responseSchema JSON para structured output
- Ejemplo de implementación TypeScript
- Lógica de failover entre API keys

Servicio a crear en: `src/lib/ai/gemini.ts` (Fase 2)

---

## Formato de la Orden de Compra (Fase 3)

Ver `docs/Formato_Orden_De_Compra.pdf` para referencia visual.
Logo para la OC: `public/logo.svg` (SVG negro/verde)

Estructura del PDF de la OC:
1. Header: Logo + "AGROINSUMOS SAS" | "ORDEN DE COMPRA" + OC# + Fecha
2. Sección Proveedor (izq) | Distribución Centro Costo (der)
3. Sección Concepto (izq) | Categoría + Información (der)
4. Fila Solicitado Por | Cargo | Correo
5. Tabla de líneas: Nro, Descripción, Cantidad, Precio Unitario, IVA, Total
6. Footer izq: # Factura - # Cotización | Footer der: Subtotal, Impuesto, Retenciones, ReteIVA, Total
7. Firmas: Hecho por + Autorizado por

Número OC formato: `AI-YY-NNN` (ej: AI-25-001). Función SQL: `generar_numero_oc()`
