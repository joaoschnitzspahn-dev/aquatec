# Aquatec — Setup externo

O app já roda em **modo demo** sem Supabase (`npm run dev`).
Use este guia quando for conectar produção.

## 1. Supabase

1. Crie um projeto em [https://supabase.com](https://supabase.com)
2. Em **Project Settings → API**, copie:
   - Project URL
   - anon public key
   - service_role key (somente servidor)
3. Em **Project Settings → Database**, copie a connection string (URI)
4. Cole no arquivo `.env` (veja `.env.example`)

## 2. Banco (Prisma)

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Se preferir só empurrar o schema:

```bash
npx prisma db push
```

## 3. Row Level Security

No SQL Editor do Supabase, execute o arquivo:

`supabase/policies.sql`

Ajuste o mapeamento `User.supabaseUserId` ↔ `auth.uid()` conforme seus usuários Auth.

## 4. Storage (fotos)

Crie buckets públicos ou com policies:

- `visit-photos`
- `client-photos`
- `product-photos`

## 5. Auth

1. Authentication → Providers → Email habilitado
2. Redirect URLs: `http://localhost:3000/**` e sua URL Vercel
3. Crie usuários e vincule em `User.supabaseUserId`

### Contas demo (modo local sem Supabase)

| E-mail | Senha | Papel |
|--------|-------|-------|
| master@aquatec.com | aquatec123 | Master |
| funcionario@aquatec.com | aquatec123 | Funcionário |

## 6. Deploy Vercel

1. Importe o repositório
2. Configure as variáveis de ambiente do `.env.example`
3. Build command: `prisma generate && next build`
4. Cron (reminders): aponte para `/api/cron` com header `Authorization: Bearer $CRON_SECRET`

Exemplo `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 8 * * *" }]
}
```

## 7. WhatsApp (opcional)

Hoje o app usa deep link `wa.me`.
Para API oficial (Cloud API), adicione depois:

- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Checklist rápido

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `CRON_SECRET`
- [ ] migrate + seed
- [ ] policies.sql
- [ ] buckets Storage
- [ ] deploy Vercel
