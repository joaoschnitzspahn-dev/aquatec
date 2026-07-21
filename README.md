# Aquatec

PWA mobile-first para empresas de manutenção de piscinas.

Stack: **Next.js 15 · React 19 · TypeScript · Tailwind · Prisma · Supabase · PWA**

## Rodar agora (demo, sem Supabase)

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

**Logins demo**

- Master: `master@aquatec.com` / `aquatec123`
- Funcionário: `funcionario@aquatec.com` / `aquatec123`

## O que já está no app

- Login / logout / esqueci senha (demo + pronto para Supabase Auth)
- Dashboard Hoje (Master e Funcionário)
- Clientes (CRUD, estoque, histórico, fotos, equipamentos, QR, mapa, WhatsApp)
- Agenda (hoje / semana / mês)
- Atendimento completo (GPS, foto chegada, checklist, produtos, leituras, assinatura, foto final, PDF)
- Estoque geral com alerta de mínimo
- Relatórios / KPIs
- Funcionários, despesas, vendas, auditoria, notificações
- Busca global + QR
- Offline queue (Dexie) + sync API
- Dark / Light mode
- Multi-tenant preparado (`companyId` em todo o schema)

## Produção (externos)

Siga o guia: [`docs/SETUP.md`](docs/SETUP.md)

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npx prisma migrate dev
npx prisma db seed
```

## Estrutura

- `src/app` — rotas App Router
- `src/components` — UI e fluxos
- `src/lib/data` — store demo + server actions
- `prisma/schema.prisma` — modelo normalizado
- `supabase/policies.sql` — RLS
