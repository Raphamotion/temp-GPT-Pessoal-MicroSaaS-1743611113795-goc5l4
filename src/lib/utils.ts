/**
 * Mascara uma chave API, mostrando apenas os primeiros caracteres após 'sk-' e os últimos.
 * Ex: sk-abcdefghijklmnopqrstuvwxyz123456 -> sk-abcd...3456
 * @param apiKey A chave API completa (deve começar com 'sk-')
 * @returns A chave mascarada ou null se a chave for inválida.
 */
export const maskApiKey = (apiKey: string | null | undefined): string | null => {
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 10) { // Precisa de sk- + pelo menos 4 + 4
    return null;
  }
  const prefix = apiKey.substring(0, 6); // "sk-abcd"
  const suffix = apiKey.substring(apiKey.length - 4); // "xyz1"
  return `${prefix}...${suffix}`;
};
