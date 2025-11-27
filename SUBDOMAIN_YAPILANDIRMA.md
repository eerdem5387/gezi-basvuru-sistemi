# 🌐 Subdomain Yapılandırma Rehberi

## 📋 Özet

Bu rehber, gezi-basvuru-sistemi'ni subdomain yapısı ile yayınlamak ve webhook entegrasyonunu yapılandırmak için gerekli adımları içerir.

---

## 🎯 Subdomain Yapısı

### Önerilen Yapı

```
basvuru.okul.com  →  Bursluluk sınavı başvuruları
gezi.okul.com     →  Gezi başvuruları (YENİ)
yonetim.okul.com  →  Okul yönetim sistemi (merkezi panel)
```

---

## 🔧 Vercel'de Subdomain Yapılandırması

### 1. Ana Domain'i Vercel'e Bağlama

1. Vercel Dashboard'a gidin
2. Ana domain'i ekleyin: `okul.com`
3. DNS kayıtlarını yapılandırın

### 2. Gezi-Basvuru-Sistemi için Subdomain Ekleme

1. Vercel Dashboard → `gezi-basvuru-sistemi` projesi
2. Settings → Domains
3. "Add Domain" tıklayın
4. `gezi.okul.com` yazın
5. DNS kayıtlarını ekleyin:
   ```
   Type: CNAME
   Name: gezi
   Value: cname.vercel-dns.com
   ```

### 3. Okul-Yonetim-Sistemi için Subdomain (Zaten Mevcut)

1. Vercel Dashboard → `okul-yonetim-sistemi` projesi
2. Settings → Domains
3. `yonetim.okul.com` kontrol edin

### 4. Basvuru-Sistemi için Subdomain (Zaten Mevcut)

1. Vercel Dashboard → `basvuru-sistemi` projesi
2. Settings → Domains
3. `basvuru.okul.com` kontrol edin

---

## 🔗 Webhook URL Yapılandırması

### Gezi-Basvuru-Sistemi Environment Variables

Vercel Dashboard → `gezi-basvuru-sistemi` → Settings → Environment Variables

```env
# Subdomain kullanarak (ÖNERİLEN)
WEBHOOK_URL=https://yonetim.okul.com/api/webhook/gezi

# Veya Vercel domain kullanarak (Alternatif)
WEBHOOK_URL=https://okul-yonetim-sistemi.vercel.app/api/webhook/gezi

# Secret key (okul-yonetim-sistemi ile aynı olmalı)
WEBHOOK_SECRET=your-super-secret-key-here-min-32-chars
```

**Önemli:** Subdomain kullanıyorsanız, webhook URL'inde subdomain'i kullanın!

### Okul-Yonetim-Sistemi Environment Variables

Vercel Dashboard → `okul-yonetim-sistemi` → Settings → Environment Variables

```env
# Secret key (gezi-basvuru-sistemi ile aynı olmalı)
WEBHOOK_SECRET=your-super-secret-key-here-min-32-chars
```

---

## 🧪 Test Etme

### 1. Subdomain Testi

```bash
# Subdomain'in çalıştığını kontrol edin
curl https://gezi.okul.com

# Veya tarayıcıda açın
https://gezi.okul.com
```

### 2. Webhook Testi

```bash
# Webhook'un çalıştığını test edin
curl -X POST https://yonetim.okul.com/api/webhook/gezi \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret-key" \
  -H "X-Webhook-Source: gezi-basvuru-sistemi" \
  -d '{
    "id": "test-123",
    "ogrenciAdSoyad": "TEST ÖĞRENCİ",
    "veliAdSoyad": "TEST VELİ",
    "ogrenciSinifi": "7",
    "veliTelefon": "5551234567",
    "ogrenciTelefon": "5557654321",
    "createdAt": "2025-01-27T10:00:00.000Z",
    "updatedAt": "2025-01-27T10:00:00.000Z"
  }'
```

---

## 🔒 SSL/TLS Sertifikası

Vercel otomatik olarak SSL sertifikası sağlar:
- ✅ HTTPS otomatik aktif
- ✅ Let's Encrypt sertifikası
- ✅ Otomatik yenileme

**Hiçbir şey yapmanıza gerek yok!** Vercel otomatik hallediyor.

---

## 📊 DNS Yapılandırması Özeti

### Ana Domain: `okul.com`

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)
```

### Subdomain'ler: `*.okul.com`

```
Type: CNAME
Name: basvuru
Value: cname.vercel-dns.com

Type: CNAME
Name: gezi
Value: cname.vercel-dns.com

Type: CNAME
Name: yonetim
Value: cname.vercel-dns.com
```

**Not:** DNS provider'ınıza göre (Cloudflare, Namecheap, GoDaddy, vb.) kayıt formatı değişebilir.

---

## 🐛 Sorun Giderme

### Subdomain Çalışmıyor

1. ✅ DNS kayıtlarını kontrol edin (CNAME doğru mu?)
2. ✅ DNS propagation'ı bekleyin (24-48 saat)
3. ✅ Vercel Dashboard'da domain durumunu kontrol edin
4. ✅ `dig gezi.okul.com` ile DNS kaydını kontrol edin

### Webhook Çalışmıyor

1. ✅ `WEBHOOK_URL` doğru mu? (Subdomain kullanıyorsanız subdomain ile)
2. ✅ `WEBHOOK_SECRET` her iki sistemde aynı mı?
3. ✅ Vercel logs'larını kontrol edin
4. ✅ Network hatası var mı? (CORS, timeout vb.)

### SSL Sertifikası Sorunu

1. ✅ Vercel otomatik SSL sağlar, manuel bir şey yapmanıza gerek yok
2. ✅ Domain doğru yapılandırıldıysa SSL otomatik aktif olur
3. ✅ Sorun varsa Vercel support ile iletişime geçin

---

## 📝 Checklist

### Subdomain Yapılandırması
- [ ] Ana domain Vercel'e bağlandı (`okul.com`)
- [ ] `gezi.okul.com` subdomain eklendi
- [ ] DNS kayıtları yapılandırıldı
- [ ] DNS propagation tamamlandı (24-48 saat)
- [ ] Subdomain test edildi (tarayıcıda açıldı)

### Webhook Yapılandırması
- [ ] `WEBHOOK_URL` environment variable eklendi (subdomain ile)
- [ ] `WEBHOOK_SECRET` environment variable eklendi
- [ ] Her iki sistemde secret aynı
- [ ] Webhook test edildi
- [ ] Vercel logs kontrol edildi

### SSL/TLS
- [ ] SSL sertifikası otomatik aktif (Vercel)
- [ ] HTTPS çalışıyor
- [ ] Tarayıcıda güvenli bağlantı gösteriliyor

---

## 🎉 Sonuç

Subdomain yapısı ile:
- ✅ Her sistem kendi subdomain'inde yayınlanır
- ✅ Webhook entegrasyonu sorunsuz çalışır
- ✅ SSL otomatik aktif
- ✅ Her sistem bağımsız deploy edilebilir

**Tahmini Kurulum Süresi:** 1-2 saat (DNS propagation hariç)

---

**Not:** DNS propagation 24-48 saat sürebilir. Sabırlı olun! 😊

