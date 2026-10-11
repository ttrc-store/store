export async function GET() {
  return new Response('google-site-verification: google0e4da828fafd7a93.html\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
