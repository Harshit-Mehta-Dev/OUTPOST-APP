export async function onRequest() {
  return new Response("google-site-verification: googleae979d12eb06b2d2.html", {
    headers: {
      "Content-Type": "text/html"
    }
  });
}
