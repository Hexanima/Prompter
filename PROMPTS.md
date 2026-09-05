Auditá origin/{{RAMA_OBJETIVO}} contra origin/{{RAMA_DESTINO}} usando triple punto (git diff origin/{{RAMA_DESTINO}}...origin/{{RAMA_OBJETIVO}}) para leer solo los commits propios de la rama.
NO hagas cambios. NO ejecutes tests, el CI se encarga de eso.
 
Si hay observaciones, generá al final un bloque markdown listo para comentario de GitHub (wrapper de cuatro backticks, código de ejemplo con tres backticks) con solo los puntos ⚠️ y ❌ encontrados.
 
[Titulo tarea]
{{TITULO_TAREA}}
 
[Descripcion tarea / Criterios de aceptación]
{{DESCRIPCION_TAREA}}

---

Prepará un plan de implementación para la tarea {{CODIGO_TAREA}}. NO hagas commits.
 
Revisá el código existente para entender el estado actual antes de planificar.
El plan debe cubrir todos los repos afectados (frontend, backend, adminPanel) si la tarea lo requiere.
Seguí TDD: incluí en el plan qué tests escribir antes de implementar.
 
[Titulo]
{{TITULO_TAREA}}
 
[Descripcion / Criterios de aceptación]
{{DESCRIPCION_TAREA}}

---

Evaluá si la siguiente tarea ya está implementada en origin/dev.
NO hagas cambios. NO ejecutes tests.
 
Revisá el código existente y determiná:
- ✅ Completamente implementado
- ⚠️ Parcialmente implementado (indicá qué falta)
- ❌ No implementado
 
[Titulo]
{{TITULO_TAREA}}
 
[Descripcion / Criterios de aceptación]
{{DESCRIPCION_TAREA}}

---

Analizá el PDF adjunto (propuesta del cliente) y el código existente del proyecto.
Generá un PRD en markdown contemplando los cambios necesarios.
NO hagas cambios. NO hagas commits.

El PRD debe incluir:
- Resumen de la propuesta
- Funcionalidades requeridas
- Cambios necesarios en el proyecto (frontend, backend, adminPanel, web según corresponda)
- Criterios de aceptación por funcionalidad

---

Sos un tech lead senior. Te voy a pasar un PRD y tu tarea es descomponerlo en tareas de desarrollo pequeñas y accionables.

Para cada tarea:
- **Título**: corto y en formato imperativo ("Crear endpoint X", "Agregar componente Y")
- **Descripción**: qué hay que hacer y por qué, en 2-3 oraciones
- **Criterios de aceptación**: lista de condiciones concretas y verificables que indican que la tarea está terminada
- **Estimación**: S (menos de 2hs) / M (medio día) / L (día completo) / XL (más de un día, considerar dividir)
- **Dependencias**: IDs de otras tareas que deben estar completas antes

Reglas:
- Ninguna tarea debe tomar más de un día. Si algo es XL, subdivididlo automáticamente.
- Las tareas deben ser lo suficientemente pequeñas para hacer un PR atómico por cada una.
- Separar siempre backend de frontend, aunque sean parte del mismo feature.
- Identificar primero las tareas de setup e infraestructura, ya que otras dependen de ellas.
- Si el PRD tiene ambigüedades que bloquean el desarrollo, listarlas al final como "Preguntas abiertas" antes de poder estimar esas tareas.

Formato de salida: Markdown, agrupado por fase o feature según esté organizado el PRD.

PRD:
[PEGAR PRD ACÁ]

---

Sos un tech lead senior. Te voy a pasar una auditoria y tu tarea es descomponerlo en tareas de desarrollo pequeñas y accionables. 

Para cada tarea:
- **Título**: corto y en formato imperativo ("Crear endpoint X", "Agregar componente Y")
- **Descripción**: qué hay que hacer y por qué, en 2-3 oraciones
- **Criterios de aceptación**: lista de condiciones concretas y verificables que indican que la tarea está terminada
- **Estimación**: S (menos de 2hs) / M (medio día) / L (día completo) / XL (más de un día, considerar dividir)
- **Dependencias**: IDs de otras tareas que deben estar completas antes

Reglas:
- Ninguna tarea debe tomar más de un día. Si algo es XL, subdivididlo automáticamente.
- Las tareas deben ser lo suficientemente pequeñas para hacer un PR atómico por cada una.
- Separar siempre backend de frontend, aunque sean parte del mismo feature.
- Identificar primero las tareas de setup e infraestructura, ya que otras dependen de ellas.
- Si la auditoria tiene ambigüedades que bloquean el desarrollo, listarlas al final como "Preguntas abiertas" antes de poder estimar esas tareas. 

Formato de salida: Markdown, agrupado por fase o feature según esté organizado el PRD.

---

Actuá como un Technical Lead senior. A continuación te proporcionaré el output de una auditoría de código. Tu objetivo es convertir cada observación en una tarea lista para subir a Jira.

**Reglas:**
1. Cada tarea dentro de un bloque markdown separado (` ```markdown `) para copiar directo a Jira sin romper el formato.
2. NO uses prefijos en los títulos (no "Tarea 1:", "Ticket 2:", etc.).
3. Analizá dependencias entre tareas y aclarálo en "Actividades vinculadas".
4. Asigná prioridad basada en el impacto: Crítica / Alta / Media / Baja.
5. Si hay ejemplos de código, incluilos con su formato correspondiente (` ```tsx `, ` ```ts `, etc.).

**Formato por tarea:**

```markdown
### [Título descriptivo]

**Detalles clave**
* Prioridad: [Crítica / Alta / Media / Baja]
* Estimación sugerida: [S / M / L / XL]
* Repo: [frontend / backend / adminPanel]

**Descripción:**
[Historia de usuario: "Como [rol], necesito que... para..."]

**Descripción técnica:**
[Detalle del problema, archivo:línea, contexto de por qué ocurre]

[Bloque de código si aplica]

**Criterios de aceptación:**
* [Condición específica y verificable]

**Actividades vinculadas:**
* [blocks / is blocked by]: [Título de tarea relacionada, o "Ninguna"
```

Auditoría:
[PEGAR OUTPUT DE AUDITORÍA ACÁ]


---

Actuá como un Tech Lead senior. Voy a pasarte un PDF/PRD y tu tarea es auditarlo contra el código existente del proyecto.

Para cada punto evaluá:
- ✅ Completamente implementado (una línea, sin detalle adicional)
- ⚠️ A corregir
- ❌ No implementado

Para cada ⚠️ y ❌ incluí:
- **Problema:** qué está mal o falta y por qué es un problema
- **Solución sugerida:** cómo debería implementarse correctamente
- **Estimación:** S (menos de 2hs) / M (medio día) / L (día completo) / XL (más de un día)

**Repos a revisar:**
- divelife-frontend
- divelife-backend
- divelife-adminPanel

**Reglas:**
- NO hagas cambios. NO hagas commits.
- NO ejecutes tests, el CI se encarga de eso.
- Si el PRD tiene ambigüedades que impiden evaluar, listarlas al final como "Preguntas abiertas" con contexto suficiente para tomar una decisión.

**Formato de salida:** Markdown, agrupado por feature o sección según esté organizado el PRD.

PDF/PRD:
[ADJUNTAR PDF O PEGAR PRD ACÁ]

---

Analiza el trabajo realizado en {{PROYECTO}} durante el periodo comprendido entre {{FECHA_INICIO}} y {{FECHA_FIN}}, consultando Jira y Confluence.

Adjunto tres elementos:

1. “Template Horas.md”: úsalo únicamente como referencia de la estructura esperada. No lo modifiques.
2. “{{ARCHIVO_REPORTE}}.md”: este es el archivo que debes modificar y completar con la información del periodo.
3. Registros de la plataforma de horas: utilízalos principalmente como fuente de los tiempos registrados por tarea.

Criterios de análisis:

- Usa Jira y Confluence para identificar qué se trabajó, el objetivo, alcance, estado y resultado de cada tarea.
- Usa los registros de horas para determinar cuántas horas se registraron en cada tarea.
- No consideres suficiente que una tarea haya sido actualizada dentro del periodo: prioriza worklogs, fechas de trabajo y evidencias concretas.
- Relaciona las tareas con sus épicas, historias, funcionalidades o páginas de Confluence correspondientes.
- Agrupa el reporte por funcionalidades nuevas. Crea una sección independiente para cada funcionalidad nueva identificada.
- Separa las funcionalidades nuevas del trabajo transversal de QA, seguridad, DevOps, mantenimiento, refactorización y soporte.
- Identifica por separado cualquier trabajo asumido por Nomu Labs que no deba descontarse de la bolsa contratada.
- No inventes información. Si una tarea no tiene evidencia suficiente, indícalo explícitamente.
- Detecta discrepancias entre Jira, Confluence y los registros de horas: tareas sin horas, horas sin tarea identificable, duplicados o diferencias de fechas.
- Calcula:
  - horas totales ejecutadas
  - horas imputables a la bolsa contratada
  - horas asumidas por Nomu Labs
  - horas contratadas
  - saldo restante o exceso
- Modifica únicamente “{{ARCHIVO_REPORTE}}.md”.
- Conserva la estructura de “Template Horas.md”, incluyendo sus nueve secciones.
- Incluye enlaces a las tareas de Jira y páginas de Confluence utilizadas como evidencia.
- Mantén un tono profesional, claro y orientado a cliente.
- Antes de finalizar, verifica que la suma de las horas por funcionalidad y trabajo transversal coincida con el total informado.