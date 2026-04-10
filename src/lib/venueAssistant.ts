import type { Place } from '../types/place';

export type AssistantResponse = {
  message: string;
  place_ids: string[];
};

const SYSTEM_PROMPT = `Sen Hep Antalya uygulamasının mekân asistanısın. Kullanıcıya verilen JSON içindeki "places" dizisinden YALNIZCA bu listede bulunan mekânları önerebilirsin. Listede olmayan isim veya adres uydurma.

Kurallar:
- Türkçe, samimi ve kısa bir özet yaz (message alanı).
- "place_ids" dizisine önerdiğin mekânların "id" değerlerini yaz (en fazla 5); hiçbiri uymuyorsa boş dizi [].
- Hayvan dostu / evcil hayvan / köpek / kedi gibi isteklerde öncelikle pet_friendly true olanlara bak.
- Restoran / kafe türü sorularında category ve kind_label alanlarını dikkate al.

Yanıtın SADECE şu JSON şemasında olsun, başka metin veya markdown ekleme:
{"message":"...","place_ids":["uuid",...]}`;

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Groq — güçlü ve hızlı: https://console.groq.com/docs/models */
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function compactPlaces(places: Place[]) {
  return places.map((p) => ({
    id: p.id,
    name: p.name,
    district: p.district,
    category: p.category,
    kind_label: p.kind_label,
    rating: p.rating,
    pet_friendly: p.pet_friendly === true,
    description: (p.description ?? '').slice(0, 500),
    address: p.address,
  }));
}

export function getGroqApiKey(): string | null {
  const k = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  return k?.trim() || null;
}

function parseGroqErrorBody(raw: string): string {
  try {
    const j = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof j.error?.message === 'string') return j.error.message;
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* ignore */
  }
  return raw;
}

export async function askVenueAssistant(
  userMessage: string,
  places: Place[]
): Promise<AssistantResponse> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error(
      'Groq API anahtarı yok. .env içine EXPO_PUBLIC_GROQ_API_KEY ekleyip Metro’yu yeniden başlat.'
    );
  }

  const payload = {
    question: userMessage.trim(),
    places: compactPlaces(places),
  };

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    const detail = parseGroqErrorBody(raw);
    throw new Error(detail || `Groq API hatası: ${res.status}`);
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq boş yanıt döndü');

  let parsed: AssistantResponse;
  try {
    parsed = JSON.parse(content) as AssistantResponse;
  } catch {
    throw new Error('Model geçersiz JSON döndü');
  }

  const validIds = new Set(places.map((p) => p.id));
  const place_ids = (parsed.place_ids ?? []).filter((id) => validIds.has(id)).slice(0, 5);

  return {
    message: typeof parsed.message === 'string' ? parsed.message : 'Öneri hazır.',
    place_ids,
  };
}
