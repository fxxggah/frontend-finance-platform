import { writeFile } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';

const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  .replace(/\/+$/, '').replace(/\/api\/v1$/, '');
const url = process.env.OPENAPI_URL || `${base}/v3/api-docs`;
const response = await fetch(url);
if (!response.ok) throw new Error(`OpenAPI indisponível: HTTP ${response.status}`);
const schema = await response.json();
const output = '// Gerado por pnpm api:types a partir do OpenAPI do backend. Não editar manualmente.\n'
  + astToString(await openapiTS(schema));

await writeFile(new URL('../openapi.json', import.meta.url), `${JSON.stringify(schema, null, 2)}\n`);
await writeFile(new URL('../types/api.generated.ts', import.meta.url), output);
console.log(`Tipos gerados a partir de ${url}`);
