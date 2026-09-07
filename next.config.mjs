// Domínios (host, sem protocolo) autorizados a chamar as Server Actions.
// Necessário porque, atrás do proxy reverso do Coolify, o Next.js precisa
// confirmar explicitamente que o domínio público é confiável.
const allowedOrigins = new Set([
  'localhost:3000',
  'ymaeujmbzric1jbavalwz8md.2.25.161.231.sslip.io',
  'diariacamp.sisgabthiago.com.br',
  'gestao.sisgabthiago.com.br',
]);

if (process.env.APP_URL) {
  try {
    allowedOrigins.add(new URL(process.env.APP_URL).host);
  } catch {
    // APP_URL inválida: ignora e segue com a lista estática acima.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: Array.from(allowedOrigins),
    },
  },
};

export default nextConfig;
