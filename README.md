# DiáriaCamp

Sistema de gestão de pagamento de diárias para trabalhadores em campanha política
(perfis Administrador, Gestor e Coordenador).

Stack: **Next.js 15 (App Router)** + **Prisma** + **PostgreSQL**, mantendo o mesmo
design/Tailwind do app original.

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e um PostgreSQL acessível (local, Docker, ou remoto).

1. Instale as dependências:
   ```
   npm install
   ```

2. Configure o `.env` (copie de `.env.example` se precisar) com a `DATABASE_URL` do
   seu Postgres e um `SESSION_SECRET` forte:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/diariacamp?schema=public"
   SESSION_SECRET="gere-um-valor-aleatorio-forte"
   ```

   Se não tiver um Postgres à mão, suba um rapidamente com Docker:
   ```
   docker compose up db -d
   ```
   (usa as credenciais padrão já configuradas em `docker-compose.yml`: user/senha
   `diariacamp`, banco `diariacamp`, porta `5432`).

3. Crie as tabelas no banco (primeira vez neste ambiente):
   ```
   npx prisma migrate dev --name init
   ```
   Isso também gera a pasta `prisma/migrations/`, que deve ser commitada no git —
   é ela que será aplicada em produção via `prisma migrate deploy`.

4. Popule o banco com os dados de demonstração (usuários, trabalhadores, diárias):
   ```
   npm run db:seed
   ```
   Usuários criados (senha padrão de todos: `123`):
   - admin@campanha.com.br (Administrador)
   - gestor@campanha.com.br (Gestor)
   - marcos@campanha.com.br / renata@campanha.com.br (Coordenadores)

5. Rode o servidor de desenvolvimento:
   ```
   npm run dev
   ```
   Acesse http://localhost:3000 — você será redirecionado para `/login`.

## Arquitetura

- **Next.js App Router** (`src/app`): `/login` (Server Component) e `/` (Server
  Component protegido por sessão, que busca os dados iniciais no Postgres via
  Prisma e os entrega para o `AppContext`, mantendo toda a navegação por abas do
  app original dentro de uma única rota — ver `src/components/AppShell.tsx`).
- **Autenticação**: cookie de sessão assinado (JWT via `jose`), senha com hash
  `bcrypt`. Ver `src/lib/auth.ts`, `src/app/actions/session.ts` e `middleware.ts`
  (protege todas as rotas exceto `/login`).
- **Persistência**: o `AppContext` (`src/context/AppContext.tsx`) continua
  aplicando as mudanças no estado local instantaneamente (mesma UX de antes) e, em
  paralelo, envia cada gravação para o Postgres via Server Actions em
  `src/app/actions/*.ts` (`workers.ts`, `diarias.ts`, `payments.ts`, `users.ts`).
  Se a sincronização falhar, uma notificação de erro aparece na tela.
- **Banco de dados**: `prisma/schema.prisma` — schema desnormalizado que espelha
  as interfaces TypeScript de `src/types.ts`, para minimizar a camada de
  conversão entre banco e front-end.

## Deploy na VPS Hostinger (Coolify)

1. No Coolify, crie um novo recurso do tipo **Dockerfile** (ou **Docker Compose**,
   usando o `docker-compose.yml` deste repositório) apontando para este
   repositório Git.
2. Configure as variáveis de ambiente do serviço da aplicação:
   - `DATABASE_URL` — string de conexão do seu PostgreSQL na VPS (pode ser outro
     recurso PostgreSQL criado no próprio Coolify, ou um serviço externo).
   - `SESSION_SECRET` — valor aleatório forte (ex.: `openssl rand -base64 32`).
   - `APP_URL` — URL pública final da aplicação.
3. Faça o deploy. O container roda `prisma migrate deploy` automaticamente antes
   de iniciar o servidor (ver `docker-entrypoint.sh`), aplicando as migrations já
   commitadas em `prisma/migrations/`.
4. Rode o seed **uma única vez**, após o primeiro deploy, para popular os usuários
   iniciais (troque as senhas depois pelo próprio app, em "Perfil" ou "Usuários"):
   ```
   docker exec -it <nome-do-container> npm run db:seed
   ```

### Backup

Como todo o estado agora vive no Postgres (e não mais no `localStorage` do
navegador), faça backups regulares do banco (`pg_dump`) — inclusive antes de
qualquer migration em produção.

## Scripts úteis

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção (roda `prisma generate` antes)
- `npm run start` — inicia o build de produção
- `npm run prisma:migrate` — cria/aplica migrations em desenvolvimento
- `npm run prisma:deploy` — aplica migrations pendentes (produção)
- `npm run prisma:studio` — interface visual do banco
- `npm run db:seed` — popula o banco com dados de demonstração
- `npm run lint` — checagem de tipos (`tsc --noEmit`)
