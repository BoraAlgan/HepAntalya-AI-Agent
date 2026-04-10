alter table public.places
  add column if not exists pet_friendly boolean not null default false;

insert into public.places (
  id, name, district, category, kind_label, image_url, rating, review_count,
  description, address, pet_friendly
) values
(
  'a1000000-0000-4000-8000-000000000001',
  'Limon Kafe',
  'Konyaaltı',
  'Kafe',
  'Kahve & tatlı',
  null,
  4.6,
  128,
  'Denize yakın terasta kahve. Köpekler için su kabı mevcut.',
  'Konyaaltı Sahil Yolu',
  true
),
(
  'a1000000-0000-4000-8000-000000000002',
  'Eski Şehir Meyhanesi',
  'Muratpaşa',
  'Restoran',
  'Ege mutfağı',
  null,
  4.4,
  342,
  'Geleneksel meze ve balık. Bahçe alanında evcil hayvan kabulü.',
  'Kaleiçi',
  true
),
(
  'a1000000-0000-4000-8000-000000000003',
  'Patiska Brunch',
  'Lara',
  'Kafe',
  'Brunch',
  null,
  4.7,
  89,
  'Hafta sonu brunch. İç mekanda hayvan kabulü yok; terasta evcil dostlar olabilir.',
  'Lara Cad.',
  true
),
(
  'a1000000-0000-4000-8000-000000000004',
  'Rıhtım Balık',
  'Muratpaşa',
  'Restoran',
  'Balık & deniz ürünleri',
  null,
  4.5,
  510,
  'Deniz manzaralı akşam yemeği. Evcil hayvan ile giriş kapalıdır.',
  'Marina',
  false
),
(
  'a1000000-0000-4000-8000-000000000005',
  'Çınar Kahvaltı',
  'Kepez',
  'Restoran',
  'Serpme kahvaltı',
  null,
  4.3,
  76,
  'Geniş bahçe; aileler ve köpek dostları için uygun.',
  'Kepez merkez',
  true
),
(
  'a1000000-0000-4000-8000-000000000006',
  'Moda Pasta',
  'Muratpaşa',
  'Kafe',
  'Pastane',
  null,
  4.2,
  201,
  'Tatlı ve kahve. Küçük terasta evcil hayvan ile oturulabilir.',
  'Işıklar',
  true
),
(
  'a1000000-0000-4000-8000-000000000007',
  'Sofra Ocakbaşı',
  'Konyaaltı',
  'Restoran',
  'Ocakbaşı',
  null,
  4.8,
  445,
  'Et ve meze. Kapalı alan; evcil hayvan kabul edilmez.',
  'Uncalı',
  false
),
(
  'a1000000-0000-4000-8000-000000000008',
  'Meltem Espresso Bar',
  'Muratpaşa',
  'Kafe',
  'Özel kahve',
  null,
  4.6,
  156,
  'Barista özel demleme. Köpek dostu masa etiketi olan koltuklar.',
  'Meltem',
  true
),
(
  'a1000000-0000-4000-8000-000000000009',
  'Dalyan Fırın',
  'Döşemealtı',
  'Kafe',
  'Fırın & kahvaltı',
  null,
  4.1,
  63,
  'Sabah simit ve çay. Bahçede evcil hayvan serbest.',
  'Döşemealtı',
  true
),
(
  'a1000000-0000-4000-8000-00000000000a',
  'Akra Fine Dining',
  'Lara',
  'Restoran',
  'Fine dining',
  null,
  4.9,
  92,
  'Rezervasyonlu akşam yemeği. Evcil hayvan kabul edilmez.',
  'Lara Oteller bölgesi',
  false
),
(
  'a1000000-0000-4000-8000-00000000000b',
  'Varsak Çiftlik Kahvaltısı',
  'Varsak',
  'Restoran',
  'Köy kahvaltısı',
  null,
  4.4,
  134,
  'Açık hava oturma; çocuk ve köpek dostu geniş alan.',
  'Varsak yolu',
  true
),
(
  'a1000000-0000-4000-8000-00000000000c',
  'Küçük Park Kafe',
  'Muratpaşa',
  'Kafe',
  'Sandviç',
  null,
  4.0,
  58,
  'Park yanı; bankta otururken köpek bağlama alanı.',
  'Gençlik Parkı yanı',
  true
)
on conflict (id) do nothing;
