# QDE — Referencia de ingeniería persistente

Fuente consolidada el 15 de septiembre de 2026 a partir de:

- `Documento explicativo QDE.docx.pdf` — QHIRO-ENG-QDE-EXPL-001, V1.0.
- `QDE finca de Guineo (EJ).pdf` — caso técnico sintético, V1.0.

## Regla prioritaria de cobertura

Una alternativa no es factible si deja cobertura de aspersión insuficiente dentro del polígono útil. El motor debe colocar y ajustar **Centinelas** hasta cumplir el umbral de cobertura configurado, incluidos bordes, esquinas, huecos y puntos críticos. El costo nunca compensa un incumplimiento de cobertura, presión, caudal, seguridad, geometría o percepción crítica.

- La separación candidata se calcula como `s = 2 × R_a × (1 − F_o)`.
- `R_a` es radio agronómico efectivo medido: no se usa la última gota visible.
- `F_o` es el solapamiento requerido para uniformidad; no es desperdicio.
- Los huecos deben medirse en el polígono, reportarse y bloquear la selección si incumplen el umbral.
- En el caso documental, la aceptación de cobertura efectiva es `A_eff / A_L ≥ 98%`; cada proyecto puede exigir un valor más estricto. Todo hueco en un punto crítico debe quedar cubierto.

## Arquitectura de dispositivos

| Componente | Función | Restricción |
| --- | --- | --- |
| El Nido | Único cerebro: autoriza misión, mezcla, bombea, comunica y recibe telemetría. | Uno por proyecto; no se delega autorización. |
| QDN | Derivado subordinado para acercar presión, dosificación o distribución. | No es un segundo Nido ni un cerebro. |
| Cabecilla | Centinela con percepción avanzada y aspersión. | Se ubica por cobertura perceptiva, criticidad y redundancia. |
| Peón | Centinela de ejecución: asperja, comunica y conserva seguridad local. | Amplía cobertura sin replicar percepción avanzada. |
| Vigía | Inspección móvil y confirmación. | No sustituye percepción fija ni se autoriza fuera del Nido. |

Cabecillas y Peones son Centinelas. Ambos participan en la cobertura de aspersión; la diferencia es la percepción avanzada de la Cabecilla. Cada dispositivo desplegado debe contar con identificador único, rol, coordenadas, sector, criterio de ubicación y márgenes operativos.

## Orden obligatorio del motor

1. Validar polígono, unidades, exclusiones y puntos críticos.
2. Validar perfiles de aspersión y percepción con versión, condiciones de ensayo y evidencia.
3. Generar posiciones candidatas solamente dentro de área útil.
4. Medir cobertura y corregir bordes, huecos, obstáculos y redundancia.
5. Asignar Cabecillas y Peones sin reducir cobertura de aspersión.
6. Sectorizar y validar caudal, pérdidas y presión terminal.
7. Validar energía, comunicación, acceso, mantenimiento y estado seguro.
8. Calcular BOM, CAPEX, costo efectivo y márgenes.
9. Seleccionar el menor CAPEX **solo** entre alternativas factibles.

## Restricciones duras mínimas

- Cobertura efectiva ≥ umbral configurado; sin huecos en puntos críticos.
- Caudal por sector ≤ caudal disponible.
- Presión terminal ≥ presión calificada `P_a`/mínimo del proyecto.
- Un único Nido; QDN subordinado.
- Distancias a obstáculos, zonas excluidas, energía y comunicaciones dentro de límite.
- Perfiles `R_a`, `F_o`, `P_a`, `Q_a`, `R_p` y `F_v` con evidencia antes de aprobar instalación real.

## Salidas requeridas del plano

- Polígono útil, exclusiones, nodos y coordenadas.
- Identificadores consecutivos por rol: `N-1`, `QDN-1`, `C-1…`, `P-1…`.
- Roles, sectores, trazado hidráulico, cobertura y huecos.
- Hidráulica: caudal, presión, pérdidas, nodo crítico y márgenes.
- BOM/CAPEX, restricciones, alternativas y causas de descarte.
- Plano y reporte versionados; el resultado debe declararse como diseño sujeto a verificación RTK y validación de campo.

## Límites declarados

El cálculo no sustituye levantamiento RTK, ensayo de aspersión/percepción, prueba hidráulica dinámica, evaluación de viento/deriva, validación de enlace ni aprobación agronómica y regulatoria.
