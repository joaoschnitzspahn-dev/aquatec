/**
 * WhatsApp helpers.
 * Today: deep link wa.me (works without API).
 * Later: Cloud API using WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
 */

export function buildWhatsAppDeepLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function sendWhatsAppCloudMessage(_input: {
  to: string;
  text: string;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return {
      ok: false as const,
      reason: "WhatsApp Cloud API não configurada. Use o deep link wa.me.",
    };
  }

  // Stub ready for Cloud API integration
  return {
    ok: false as const,
    reason: "Integração Cloud API pendente — configure e implemente o POST oficial.",
  };
}
