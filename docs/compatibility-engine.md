# Deep Chemistry Engine (Hybrid Compatibility)

## Visión General
El motor calcula un score de 0 a 100 indicando la probabilidad de una conexión significativa y duradera.

## Pipeline de Datos
1.  **Extract**: Perfiles, Actividad (HeartScore), Social Energy.
2.  **Transform**: `Feature Builder` normaliza deltas de edad, overlap de intereses, etc.
3.  **Score**: `Hybrid Scorer` aplica reglas deterministas (vetos) + heurísticas de negocio.
4.  **Explain**: Genera razones en lenguaje natural para el usuario.

## Fairness & Bias
- **Audit**: Ejecutamos `biasAudit` diariamente para asegurar que la distribución de scores no favorezca injustamente a un grupo demográfico.
- **Women First**: El score no sobreescribe las reglas de iniciación de chat.
