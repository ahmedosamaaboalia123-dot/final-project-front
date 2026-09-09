import apiClient from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

// Smart barista chat backed by the backend DeepSeek integration
// (POST /api/chat). The backend runs in customer mode (no auth) and only the
// public get_products tool is enabled, so replies are always product-safe
// (no ingredients, costs, or internal data).

export async function sendChatMessage(messages) {
  try {
    const payload = await apiClient.post(endpoints.chat.send, {
      messages: Array.isArray(messages) ? messages : [{ role: "user", content: String(messages || "") }],
    });
    return {
      reply: payload?.data?.reply ?? "",
      isStaff: Boolean(payload?.data?.isStaff),
      usage: payload?.data?.usage ?? null,
    };
  } catch (err) {
    console.error("chatService: failed to send message", err);
    const fallback =
      err?.response?.status === 500
        ? "هذا البوت مش متصل حاليًا، جرب بعد قليل."
        : "حدث خطأ، حاول مرة أخرى.";
    throw new Error(fallback);
  }
}