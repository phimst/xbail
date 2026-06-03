"use strict";
const util = require("util");
const { getSystemInfo, formatSystemInfo } = require("./system-info");

const PREFIX = ".";
const TRIGGERS = new Set([".baileys", ".bails", ".ping", ".evph", ".mesinfF"]);

/** Extract plain text dari semua message type */
const extractText = (msg) => {
    const m = msg?.message;
    if (!m) return "";
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.documentMessage?.caption ||
        m.buttonsResponseMessage?.selectedDisplayText ||
        m.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ""
    ).trim();
};

/** Extract quoted message + metadata dari contextInfo */
const extractQuoted = (msg) => {
    const m = msg?.message;
    if (!m) return null;
    // cari contextInfo di semua message type yang mungkin
    const msgTypes = Object.keys(m);
    for (const t of msgTypes) {
        const ctx = m[t]?.contextInfo;
        if (ctx?.quotedMessage) {
            const mtype = Object.keys(ctx.quotedMessage)[0] || "unknown";
            return {
                key: {
                    remoteJid: msg.key?.remoteJid,
                    id: ctx.stanzaId,
                    participant: ctx.participant,
                    fromMe: ctx.stanzaId === msg.key?.id,
                },
                message: ctx.quotedMessage,
                mtype,
                sender: ctx.participant || msg.key?.remoteJid,
            };
        }
    }
    return null;
};

// ─── Handlers ────────────────────────────────────────────────────────────────

const handleBaileys = async (sock, msg, jid) => {
    const start = Date.now();
    const info = getSystemInfo(0);
    info.ping = Date.now() - start;
    await sock.sendMessage(jid, { text: formatSystemInfo(info) }, { quoted: msg });
};

const handleEval = async (sock, msg, jid, text) => {
    const reply = (out) => sock.sendMessage(jid, { text: String(out) }, { quoted: msg });
    const args = text.trim().split(/\s+/).slice(1).join(" ");
    if (!args) return reply(`*Contoh:* ${PREFIX}eval m.chat`);
    let result;
    try {
        const m = msg; // shorthand di dalam eval
        result = await eval(`(async () => { ${args.startsWith("return") ? "" : "return "}${args} })()`);
    } catch (e) {
        result = e;
    }
    await reply(util.format(result));
};

const handleMesInfo = async (sock, msg, jid) => {
    const reply = (out) => sock.sendMessage(jid, { text: out }, { quoted: msg });
    const quoted = extractQuoted(msg);
    if (!quoted) return reply(`Reply sebuah pesan dengan *${PREFIX}mesinfo*`);
    await reply([
        `╭━━━「 *📋 MESSAGE INFO* 」`,
        `┃`,
        `┃  🔖 Type   : *${quoted.mtype}*`,
        `┃  🆔 ID     : \`${quoted.key?.id || "-"}\``,
        `┃  👤 Sender : ${quoted.sender || "-"}`,
        `╰━━━━━━━━━━━━━━━━━━━━━━`,
    ].join("\n"));
};

// ─── Dispatcher ──────────────────────────────────────────────────────────────

/**
 * Handle semua built-in command
 * @returns {Promise<boolean>} true jika command tertangani
 */
const handleBuiltinCommand = async (sock, msg) => {
    if (msg?.key?.fromMe) return false;
    const text = extractText(msg);
    if (!text.startsWith(PREFIX)) return false;
    const cmd = text.split(/\s+/)[0].toLowerCase();
    if (!TRIGGERS.has(cmd)) return false;
    const jid = msg.key?.remoteJid;
    if (!jid) return false;

    try {
        switch (cmd) {
            case ".baileys":
            case ".bails":
            case ".ping":
                await handleBaileys(sock, msg, jid);
                break;
            case ".eval":
                await handleEval(sock, msg, jid, text);
                break;
            case ".mesinfo":
                await handleMesInfo(sock, msg, jid);
                break;
            default: return false;
        }
    } catch (_) { /* silent — jangan crash socket */ }

    return true;
};

module.exports = {
    TRIGGERS, extractText, extractQuoted,
    handleBuiltinCommand, handleBaileys, handleEval, handleMesInfo
};
