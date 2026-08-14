# Legal Analyzer Frontend

Frontend React/TypeScript para o backend `legal-analyzer`.

## O que foi desenhado a partir do backend e PDF

- Upload de PDF para `POST /api/v1/processos/analisar`
- Polling do job assíncrono em `GET /api/v1/processos/analises/{id}`
- Progresso visual: extração → partes → consolidação → evidências → relatório
- Briefing de assunção
- Partes, situação, pontos de atenção, linha do tempo e evidências
- Chat ancorado nos autos
- Disparo da análise especializada
- Layout responsivo, corporativo e orientado a escritório de advocacia
- Linguagem visual alinhada à proposta do PDF: sigilo, rastreabilidade, previsibilidade e apoio à decisão

## Executar

```bash
npm install
cp .env.example .env
npm run dev
```

Backend esperado em `http://localhost:8080`.

Para outro endereço:

```env
VITE_API_URL=http://localhost:8080
```

## Observação

O backend atual não expõe autenticação nem endpoints de listagem de processos. Por isso a primeira versão do frontend trabalha com a sessão do processo recém-enviado e não inventa uma persistência de casos que o backend ainda não oferece.
