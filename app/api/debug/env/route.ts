export async function GET() {
  const present = (k: string) => Boolean(process.env[k]);
  return new Response(JSON.stringify({
    RETELL_API_KEY: present('RETELL_API_KEY'),
    RETELL_KNOWLEDGE_BASE_ID: present('RETELL_KNOWLEDGE_BASE_ID'),
    ADMIN_USERNAME: present('ADMIN_USERNAME'),
    CUSTOMER_USERNAME: present('CUSTOMER_USERNAME'),
    JWT_SECRET: present('JWT_SECRET'),
    NODE_ENV: process.env.NODE_ENV,
  }), { headers: { 'content-type': 'application/json' }});
}
