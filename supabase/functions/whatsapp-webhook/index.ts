// Meta WhatsApp Cloud API webhook for Equase
// Supabase Edge Function (Deno)

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Meta webhook verification handshake
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // Receive WhatsApp message/status webhook events
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Acknowledge Meta quickly. Processing/storage can be added here later.
      console.log("WhatsApp webhook event:", JSON.stringify(body));

      return new Response("EVENT_RECEIVED", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      console.error("Invalid WhatsApp webhook payload:", error);
      return new Response("Bad Request", { status: 400 });
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, POST" },
  });
});
