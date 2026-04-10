# HepAntalya (Expo)



Antalya’daki mekanlar listeleniyor, detayına girilebiliyor. Supabase ile giriş ve kayıt yapılabiliyor, favorilere ekleme var. İstenirse mekanlar ekranının üstündeki yıldızdan asistan ekranına da geçilebiliyor. O kısım Groq üzerinden çalışıyor, anahtar `.env` dosyasından okunuyor.



## Ne lazım



Bilgisayarda Node kurulu olması yeterli, geri kalanı npm ile geliyor. Telefonda Expo Go varsa QR ile açılabiliyor, yoksa emülatör de kullanılabiliyor.



## İlk kurulum



Repoyu indirdikten sonra klasörde paketler kurulur. Kök dizinde `.env` dosyası oluşturulur (git’e eklenmez, ignore’da). İçine Supabase URL ve anon key yazılması gerekiyor, isimler `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Panelden **JWT formatındaki** anon anahtar alınır, yeni `sb_publishable_...` tipi bazen client’ta takılıyorsa klasik anon JWT’ye dönülebilir.



Asistanın denenmesi istenirse aynı dosyaya `EXPO_PUBLIC_GROQ_API_KEY` eklenebilir, Groq’tan key alınır. Bu değişkenler `EXPO_PUBLIC_` ile başladığı için build’e gömülür, canlıya çıkarken anahtarın arka tarafta tutulması daha mantıklı olur.



`.env` değiştirildiyse Metro kapatılıp yeniden açılmalı, yoksa eski değerler kalabiliyor.



Çalıştırmak için projede alışıldığı `expo start` veya npm script’i kullanılabiliyor. Detay komut satırına yazılmıyor buraya.



## Supabase tarafı



Uygulama `places` tablosundan mekan çekiyor. `favorites` kullanıcıya göre. Kayıtta profil için `display_name` gönderiliyor, Supabase tarafında trigger vs. kurulan yapıya uyumlu olmalı. Özet olarak `places`’te id, isim, ilçe, kategori, görsel, puan, açıklama, adres, `pet_friendly` gibi alanlar var, favorilerde kullanıcı ve mekan eşlemesi.



Örnek veri atılmak istenirse `supabase/seed_places.sql` dosyası var, Supabase SQL ekranından çalıştırılabilir. Çakışma olursa script’te `on conflict` tarafına bakılabilir.



## Manuel adımlar



Liste açılır, filtre uygulanır, detaya girilir, hesaptan giriş yapılır, kalp ile favori eklenir, favoriler sekmesinden tekrar detaya gidilir. Asistan için `.env`’de Groq anahtarı bulunmalı.



## Bir şeyler ters giderse



Supabase bazen kısa sürede çok kayıt veya şifre sıfırlama denendiğinde e-posta limiti hatası veriyor, bir süre beklemek veya testte mail doğrulamasının kapatılması (sadece dev için) işe yarayabiliyor.



## Klasörler (kabaca)



`App.tsx` giriş noktası, `src/screens` ekranlar, `src/navigation` sekmeler ve stack, `src/context` auth, `src/lib` supabase ve asistan isteği, `src/types` tipler.



## Lisans



Private proje.


