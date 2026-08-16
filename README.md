# Legal Analyzer Frontend

Frontend React + TypeScript do `legal-analyzer`, com interface orientada ao trabalho jurídico.

## Status atual

O frontend já suporta:

- Upload de PDF e acompanhamento do processamento assíncrono.
- Visualização de progresso e logs/status do backend.
- Briefing, partes, situação, pontos de atenção, linha do tempo e evidências.
- Chat ancorado nos autos.
- Configuração e disparo da análise jurídica especializada.
- Exportação do relatório PDF persistido pelo backend.
- Área **Pesquisas** integrada ao DataJud/CNJ.
- Pesquisa por CNJ.
- Pesquisa por CPF.
- Pesquisa agregada por Tribunal + Assunto/TPU.
- Exibição dos resultados encontrados.
- Ação **Processar** para colocar um processo encontrado no mesmo fluxo do upload.
- Histórico de pesquisas disponível no backend para evolução da tela de pesquisas.
- Layout responsivo e corporativo.

## Fluxo de pesquisas

```text
Pesquisas
   │
   ├── CNJ
   ├── CPF
   └── Tribunal + Assunto / TPU
          │
          ▼
       DataJud
          │
          ▼
   Resultado persistido
          │
          ▼
      Processar
          │
          ▼
   Mesmo fluxo do upload
          │
          ▼
 Agentes → RAG → Relatório PDF
```

A persistência do resultado é responsabilidade do backend. O frontend não considera um processo encontrado como processado até receber o `analiseId` do backend.

## Backend

O backend esperado é:

```text
http://localhost:8080
```

Configure outro endereço em `.env`:

```env
VITE_API_URL=http://localhost:8080
```

## Executar

```bash
npm install
cp .env.example .env
npm run dev
```

## Principais integrações

```text
POST /api/v1/processos/analisar
GET  /api/v1/processos/analises/{id}
GET  /api/v1/processos/analises/{id}/relatorio-pdf
GET  /api/v1/datajud/processos/cnj
GET  /api/v1/datajud/processos/cpf
GET  /api/v1/datajud/processos/amostra
POST /api/v1/datajud/processos/cnj/processar
POST /api/v1/datajud/processos/cpf/processar
POST /api/v1/datajud/processos/amostra/processar
GET  /api/v1/datajud/pesquisas
```

## Arquitetura visual

A navegação principal fica no topo, incluindo **Processos** e **Pesquisas**. A área de pesquisas concentra as consultas externas e evita espalhar funcionalidades de DataJud pela tela principal.

## Observação

Autenticação e autorização ainda não estão implementadas. A aplicação deve ser tratada como ambiente de desenvolvimento até que essas camadas sejam adicionadas.
