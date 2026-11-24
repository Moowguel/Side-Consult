# Painel Power BI: SideConsult

## 1. Obter os dados

1. Entre como gestor (`gestor@saude.gov`) em `/management`, aplique os filtros e clique em **CSV p/ Power BI**
   (ou use `data/processed/triagens_padronizadas.csv`, gerado pelo pipeline).
2. Power BI Desktop → **Obter dados → Texto/CSV** → delimitador **ponto e vírgula**, codificação **UTF-8**.
3. No Power Query, defina os tipos: `data` = Data, `hora` = Hora, `gravidade_*` e `idade`/`dor` = Número inteiro,
   `confianca_ia` = Número decimal (vírgula decimal, localidade pt-BR).
4. Crie uma tabela **Calendario** para inteligência de tempo:

```DAX
Calendario = CALENDAR ( MIN ( Triagens[data] ), MAX ( Triagens[data] ) )
```

Relacione `Calendario[Date]` → `Triagens[data]`.

## 2. Medidas DAX

```DAX
Atendimentos = COUNTROWS ( Triagens )

Emergencias = CALCULATE ( [Atendimentos], Triagens[gravidade_final] = 5 )

% Emergencias = DIVIDE ( [Emergencias], [Atendimentos] )

Casos Graves = CALCULATE ( [Atendimentos], Triagens[gravidade_final] >= 4 )

IA Elevou Prioridade =
CALCULATE (
    [Atendimentos],
    FILTER ( Triagens, Triagens[gravidade_ia] > Triagens[gravidade_regras] )
)

Concordancia IA x Medico =
VAR revisados = FILTER ( Triagens, NOT ISBLANK ( Triagens[gravidade_medico] ) && NOT ISBLANK ( Triagens[gravidade_ia] ) )
RETURN DIVIDE (
    COUNTROWS ( FILTER ( revisados, Triagens[gravidade_medico] = Triagens[gravidade_final] ) ),
    COUNTROWS ( revisados )
)

Media Movel 7d =
AVERAGEX (
    DATESINPERIOD ( Calendario[Date], MAX ( Calendario[Date] ), -7, DAY ),
    [Atendimentos]
)

Indice de Surto = DIVIDE ( [Atendimentos], [Media Movel 7d] )

Alerta de Surto = IF ( [Indice de Surto] > 2 && [Atendimentos] >= 8, "⚠ Surto provável", "Normal" )

Alertas IoT = CALCULATE ( [Atendimentos], Triagens[origem] = "IOT" )
```

## 3. Visuais sugeridos

| Visual | Campos |
|---|---|
| Cartões | Atendimentos, % Emergencias, IA Elevou Prioridade, Concordancia IA x Medico |
| Gráfico de colunas + linha | Eixo `Calendario[Date]`, colunas `Atendimentos`, linha `Media Movel 7d` |
| Matriz | Linhas `regiao`, colunas `sintomas`, valores `Atendimentos`, formatação condicional por `Indice de Surto` |
| Rosca | `gravidade_final` × `Atendimentos` |
| Segmentações | `regiao`, `origem`, `Calendario[Date]`, `gravidade_final` |
