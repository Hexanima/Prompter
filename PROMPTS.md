<!--
@field RAMA_OBJETIVO
label: Rama objetivo
help: Rama que contiene los cambios propios a revisar.
placeholder: feature/mi-tarea
type: text
-->

<!--
@field RAMA_DESTINO
label: Rama destino
help: Rama base contra la que se compara.
placeholder: dev
type: text
default: dev
-->

<!--
@field TITULO_TAREA
label: Título de la tarea
help: Nombre corto de la tarea o funcionalidad.
placeholder: Ejemplo: Implementar login
type: text
-->

<!--
@field DESCRIPCION_TAREA
label: Descripción y criterios de aceptación
help: Contexto, alcance y condiciones verificables de la tarea.
placeholder: Pegá aquí la descripción completa de la tarea...
type: textarea
-->

<!--
@field CODIGO_TAREA
label: Código de la tarea
help: Identificador de Jira o ticket.
placeholder: Ejemplo: PROJ-123
type: text
-->

<!--
@field PRD
label: PRD
help: Pegá aquí el PRD que querés descomponer.
placeholder: Pegá aquí el PRD completo...
type: textarea
-->

<!--
@field PROYECTO
label: Proyecto
help: Proyecto cuyo trabajo querés analizar.
placeholder: Ejemplo: Mi proyecto
type: text
-->

<!--
@field FECHA_INICIO
label: Fecha de inicio
help: Inicio del período a analizar.
placeholder: AAAA-MM-DD
type: text
-->

<!--
@field FECHA_FIN
label: Fecha de fin
help: Fin del período a analizar.
placeholder: AAAA-MM-DD
type: text
-->

<!--
@field ARCHIVO_REPORTE
label: Archivo de reporte
help: Nombre del archivo markdown que se debe completar.
placeholder: Ejemplo: Reporte septiembre
type: text
-->

<!--
@prompt
title: Auditar rama contra otra rama
description: Revisa únicamente los cambios propios de una rama usando triple punto.
-->

Auditá origin/{{RAMA_OBJETIVO}} contra origin/{{RAMA_DESTINO}} usando triple punto (git diff origin/{{RAMA_DESTINO}}...origin/{{RAMA_OBJETIVO}}) para leer solo los commits propios de la rama.
NO hagas cambios. NO ejecutes tests, el CI se encarga de eso.

Si hay observaciones, generá al final un bloque markdown listo para comentario de GitHub (wrapper de cuatro backticks, código de ejemplo con tres backticks) con solo los puntos ⚠️ y ❌ encontrados.

[Titulo tarea]
{{TITULO_TAREA}}

[Descripcion tarea / Criterios de aceptación]
{{DESCRIPCION_TAREA}}

---

<!--
@prompt
title: Preparar plan de implementación
description: Genera un plan técnico accionable y orientado a TDD.
-->

Prepará un plan de implementación para la tarea {{CODIGO_TAREA}}. NO hagas commits.

Revisá el código existente para entender el estado actual antes de planificar.
El plan debe cubrir todos los repos afectados (frontend, backend, adminPanel) si la tarea lo requiere.
Seguí TDD: incluí en el plan qué tests escribir antes de implementar.

[Titulo]
{{TITULO_TAREA}}

[Descripcion / Criterios de aceptación]
{{DESCRIPCION_TAREA}}

---

<!--
@prompt
title: Evaluar implementación de una tarea
description: Determina si la tarea está completamente, parcialmente o no implementada.
-->

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

<!--
@prompt
title: Generar PRD desde una propuesta
description: Convierte una propuesta del cliente en un PRD alineado con el código existente.
-->

Analizá el PDF adjunto (propuesta del cliente) y el código existente del proyecto.
Generá un PRD en markdown contemplando los cambios necesarios.
NO hagas cambios. NO hagas commits.

El PRD debe incluir:

- Resumen de la propuesta
- Funcionalidades requeridas
- Cambios necesarios en el proyecto (frontend, backend, adminPanel, web según corresponda)
- Criterios de aceptación por funcionalidad

---

<!--
@prompt
title: Descomponer PRD en tareas
description: Divide un PRD en tareas de desarrollo pequeñas, accionables y estimables.
-->

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
{{PRD}}

---

<!--
@prompt
title: Descomponer auditoría en tareas
description: Convierte las observaciones de una auditoría en tareas de desarrollo.
-->

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

## Formato de salida: Markdown, agrupado por fase o feature según esté organizado el PRD.

<!--
@prompt
title: Auditar PRD contra el código
description: Evalúa cada requisito del PRD contra la implementación existente.
-->

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
{{PRD}}

---

<!--
@prompt
title: Analizar horas del proyecto
description: Completa un reporte profesional usando Jira, Confluence y los registros de horas.
-->

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
