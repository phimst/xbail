# WhatsApp Baileys

<p align="center">
  <img src="https://raw.githubusercontent.com/phimst/image/refs/heads/main/Angel.jpeg" alt="Thumbnail" />
</p>

WhatsApp Baileys is an open-source library designed to help developers build automation solutions and integrations with WhatsApp efficiently and directly. Using websocket technology without the need for a browser, this library supports a wide range of features such as message management, chat handling, group administration, as well as interactive messages and action buttons for a more dynamic user experience.

---

## Changelog (Latest Update)

### Bug Fixes
- **`@lid` participant remap** — sebelumnya hanya `extendedTextMessage`, sekarang **semua message type** (image, video, document, dll) di group LID sudah di-remap dengan benar
- **`handleGroupStory`** — sekarang return object lengkap dengan `.key` (sebelumnya return raw `relayMessage` yang bisa `undefined`)
- **`sendStatusMention`** — error per-JID tidak lagi menghentikan loop, sekarang `continue` ke JID berikutnya + delay random (1.5–2.5s) agar lebih natural
- **`generateMessageID`** — prefix diubah dari `Z4PH-` ke format yang lebih mirip WA asli (`3A`, `3E`, dll)
- **`lidDbMigrated`** — tidak lagi hardcoded `false`, sekarang dynamic dari config (default `true` agar behavior natural)
- **Banner ASCII** — tidak lagi spam setiap kali module di-`require`, sekarang hanya tampil sekali via env flag

### New Features
- **`clientType`** config — pilih `"default"` / `"messenger"` / `"business"` untuk set browser agent otomatis
- **`enableBuiltinCommands`** config — toggle built-in commands (default `true`)
- **`Features/`** module — modul baru yang bisa diimport langsung
- **Rate Limiter** built-in — otomatis throttle `sendMessage` per-JID, configurable
- **`Function/`** sekarang ter-export dari root package

---

## Getting Started

```javascript
const { makeWASocket, useMultiFileAuthState } = require("xbail");

const { state, saveCreds } = await useMultiFileAuthState("./auth");

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,

    // clientType: "default" | "messenger" | "business"
    clientType: "default",

    // matikan jika tidak ingin built-in commands (.baileys, .eval, .mesinfo)
    enableBuiltinCommands: true,

    // lidDbMigrated: true = behavior natural seperti WA client resmi
    lidDbMigrated: true,
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    // handle pesan di sini
});
```

---

## Config Options

| Key | Default | Keterangan |
|---|---|---|
| `clientType` | `"default"` | Browser agent: `"default"` / `"messenger"` / `"business"` |
| `enableBuiltinCommands` | `true` | Aktifkan `.baileys` `.eval` `.mesinfo` |
| `lidDbMigrated` | `true` | LID DB migration flag — `true` lebih natural |

---

## Built-in Commands

Aktif otomatis saat `enableBuiltinCommands: true`. Kirim di chat mana pun:

| Command | Fungsi |
|---|---|
| `.baileys` / `.bails` / `.ping` | Info server, library, RAM, uptime, ping |
| `.eval <code>` | Evaluasi JavaScript (developer only) |
| `.mesinfo` | Reply pesan → tampilkan type & ID |

Matikan semua:
```javascript
makeWASocket({ enableBuiltinCommands: false })
```

---

## Rate Limiter

Built-in rate limiter aktif otomatis di `sendMessage`. Default: max 20 pesan/menit per JID, min delay 500ms.

```javascript
// Skip rate limiter untuk satu pesan tertentu:
await sock.sendMessage(jid, { text: "hi" }, { skipRateLimit: true });
```

Gunakan `RateLimiter` secara manual:
```javascript
const { RateLimiter } = require("xbail");

const limiter = new RateLimiter({ maxPerMinute: 10, minDelayMs: 1000 });
await limiter.throttle(jid);
limiter.record(jid);
```

---

## Events

```javascript
// Pesan masuk
sock.ev.on("messages.upsert", ({ messages, type }) => { ... });

// Status read/edit/delete
sock.ev.on("messages.update", (updates) => { ... });

// State koneksi
sock.ev.on("connection.update", ({ connection, qr, lastDisconnect }) => { ... });

// Simpan credentials
sock.ev.on("creds.update", saveCreds);

// Presence (online/typing)
sock.ev.on("presence.update", ({ id, presences }) => { ... });

// Group event
sock.ev.on("groups.upsert", (groups) => { ... });
sock.ev.on("groups.update", (updates) => { ... });

// Newsletter/Channel
sock.ev.on("newsletter.reaction", ({ id, reaction }) => { ... });
sock.ev.on("newsletter.view",     ({ id, count })    => { ... });

// Panggilan
sock.ev.on("call", (calls) => { ... });
```

---

## SendMessage Documentation

### Text Biasa
```javascript
await sock.sendMessage(jid, { text: "Hello World" });
```

### Gambar / Video / Audio / Dokumen
```javascript
// Gambar dari URL
await sock.sendMessage(jid, { image: { url: "https://..." }, caption: "caption" });

// Video dari buffer
await sock.sendMessage(jid, { video: fs.readFileSync("./video.mp4"), caption: "caption" });

// Audio / Voice Note
await sock.sendMessage(jid, { audio: { url: "https://..." }, mimetype: "audio/mp4", ptt: true });

// Dokumen
await sock.sendMessage(jid, { document: fs.readFileSync("./file.pdf"), mimetype: "application/pdf", fileName: "file.pdf" });
```

### Status Group (groupStatusMessage)
```javascript
await sock.sendMessage(jid, {
    groupStatusMessage: { text: "Hello from group status" }
});
// dengan gambar:
await sock.sendMessage(jid, {
    groupStatusMessage: { image: { url: "https://..." }, caption: "caption" }
});
```

### Status Mention
```javascript
await sock.sendStatusMention(content, [jid1, jid2]);
```

### Album (Multiple Images)
```javascript
await sock.sendMessage(jid, {
    albumMessage: [
        { image: buffer1, caption: "Foto 1" },
        { image: { url: "https://..." }, caption: "Foto 2" }
    ]
}, { quoted: m });
```

### Event Message
```javascript
await sock.sendMessage(jid, {
    eventMessage: {
        isCanceled: false,
        name: "Nama Event",
        description: "Deskripsi",
        location: { degreesLatitude: 0, degreesLongitude: 0, name: "Lokasi" },
        joinLink: "https://call.whatsapp.com/video/xxx",
        startTime: "1763019000",
        endTime: "1763026200",
        extraGuestsAllowed: false
    }
}, { quoted: m });
```

### Poll Result
```javascript
await sock.sendMessage(jid, {
    pollResultMessage: {
        name: "Judul Poll",
        pollVotes: [
            { optionName: "Opsi A", optionVoteCount: "5" },
            { optionName: "Opsi B", optionVoteCount: "2" }
        ]
    }
}, { quoted: m });
```

### Interactive Message
```javascript
// Simple button
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Header",
        title: "Judul",
        footer: "Footer",
        buttons: [
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "Copy Code",
                    id: "123",
                    copy_code: "KODE123"
                })
            }
        ]
    }
}, { quoted: m });
```

### Interactive + NativeFlow
```javascript
await sock.sendMessage(jid, {
    interactiveMessage: {
        header: "Header",
        title: "Judul",
        footer: "Footer",
        image: { url: "https://..." },
        nativeFlowMessage: {
            buttons: [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Pilih opsi",
                        sections: [
                            {
                                title: "Kategori",
                                rows: [
                                    { title: "Opsi 1", description: "desc", id: "row_1" },
                                    { title: "Opsi 2", description: "desc", id: "row_2" }
                                ]
                            }
                        ]
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Kunjungi",
                        url: "https://example.com"
                    })
                }
            ]
        }
    }
}, { quoted: m });
```

### Product Message
```javascript
await sock.sendMessage(jid, {
    productMessage: {
        title: "Nama Produk",
        description: "Deskripsi produk",
        thumbnail: { url: "https://..." },
        productId: "PROD001",
        priceAmount1000: 50000,
        currencyCode: "IDR",
        buttons: [
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Beli Sekarang",
                    url: "https://example.com/buy"
                })
            }
        ]
    }
}, { quoted: m });
```

### Request Payment
```javascript
await sock.sendMessage(jid, {
    requestPaymentMessage: {
        currency: "IDR",
        amount: 10000000,
        from: m.sender,
        background: {
            id: "100",
            width: 1000,
            height: 1000,
            mimetype: "image/webp",
            placeholderArgb: 0xFF00FFFF,
            textArgb: 0xFFFFFFFF,
            subtextArgb: 0xFFAA00FF
        }
    }
}, { quoted: m });
```

---

## Utility Functions

### Label Group
```javascript
await sock.setLabelGroup(jid, "label text");
```

### Check ID Channel dari URL
```javascript
const info = await sock.newsletterFromUrl("https://whatsapp.com/channel/...");
// { name, id, state, subscribers, verification, creation_time, description }
```

### Check Nomor WhatsApp
```javascript
const result = await sock.checkWhatsApp(jid);
```

### TikTok Downloader
```javascript
const { TikTok } = require("xbail");
const result = await TikTok("https://www.tiktok.com/@user/video/xxx");
```

### Bypass Turnstile
```javascript
const { BypassTurnstileMin } = require("xbail");
const result = await BypassTurnstileMin("https://site.com", "siteKey");
```

### System Info (untuk bot)
```javascript
const { getSystemInfo, formatSystemInfo } = require("xbail");
const info = getSystemInfo(pingMs);
console.log(formatSystemInfo(info));
```

---

## Why Choose WhatsApp Baileys?

Karena library ini menawarkan stabilitas tinggi, fitur lengkap, dan proses pairing yang terus ditingkatkan. Cocok untuk developer yang ingin membuat solusi otomasi WhatsApp yang profesional dan stabil.

---


### Contributors

<table>
  <tr>
  <td align="center">
      <a href="https://github.com/phimst">
        <img src="https://github.com/phimst.png" width="80px;" style="border-radius:50%;" alt="Uploader"/>
        <br /><sub><b>Seraphim</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/raldzfvck">
        <img src="https://github.com/raldzfvck.png" width="80px;" style="border-radius:50%;" alt="Uploader"/>
        <br /><sub><b>RaldzzXyz</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/kiuur">
        <img src="https://github.com/kiuur.png" width="80px;" style="border-radius:50%;" alt="Developer"/>
        <br /><sub><b>KyuuRzy</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/RexxHayanasi">
        <img src="https://github.com/RexxHayanasi.png" width="80px;" style="border-radius:50%;" alt="Contributor"/>
        <br /><sub><b>RexxHayanasi</b></sub>
      </a>
    </td>
  </tr>
</table>
