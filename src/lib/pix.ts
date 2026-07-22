/** Gerador de PIX Copia e Cola (BR Code) — mesma chave da Aquatec. */

export const AQUATEC_PIX = {
  key: "45377883000191",
  merchantName: "AQUATEC",
  merchantCity: "SAO PAULO",
  txid: "***",
} as const;

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Monta payload PIX estático/dinâmico com valor.
 * Compatível com o formato usado em aquatec.rodcode.com.br
 */
export function buildPixPayload(opts: {
  amount: number;
  description?: string;
}) {
  const amount = opts.amount.toFixed(2);
  const description = (opts.description || "Pagamento Produtos")
    .slice(0, 25)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const merchantAccount =
    tlv("00", "BR.GOV.BCB.PIX") +
    tlv("01", AQUATEC_PIX.key) +
    tlv("02", description);

  const additional = tlv("05", AQUATEC_PIX.txid);

  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("26", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", amount) +
    tlv("58", "BR") +
    tlv("59", AQUATEC_PIX.merchantName) +
    tlv("60", AQUATEC_PIX.merchantCity) +
    tlv("62", additional) +
    "6304";

  return body + crc16(body);
}
