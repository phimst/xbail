"use strict";
const os = require("os");

const buildBar = (used, total, size = 10) => {
    const pct = total > 0 ? Math.min(Math.round((used / total) * size), size) : 0;
    return `[${"█".repeat(pct)}${"░".repeat(size - pct)}] ${total > 0 ? Math.round((used / total) * 100) : 0}%`;
};

const formatUptime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s}s`;
};

const getSystemInfo = (pingMs = 0) => {
    const mem = process.memoryUsage();
    const totalRam = Math.round(os.totalmem() / 1024 / 1024);
    const freeRam  = Math.round(os.freemem()  / 1024 / 1024);
    const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(mem.heapTotal / 1024 / 1024);
    const usedRam = totalRam - freeRam;

    let waVersion = "unknown";
    try {
        waVersion = require("../Defaults/baileys-version.json").version.join(".");
    } catch (_) {}

    return {
        library: {
            name: "xbail",
            version: require("../../../package.json").version || "1.0.0",
            waVersion,
            author: require("../../../package.json").author || "Seraph!m"
        },
        runtime: {
            node: process.version,
            platform: `${os.platform()}/${os.arch()}`,
            uptime: formatUptime(process.uptime())
        },
        memory: {
            heapUsed, heapTotal,
            rss: Math.round(mem.rss / 1024 / 1024),
            heapBar: buildBar(heapUsed, heapTotal)
        },
        system: {
            cpus: os.cpus().length,
            cpuModel: (os.cpus()[0]?.model || "Unknown").trim().replace(/\s+/g, " "),
            totalRam, freeRam, usedRam,
            ramBar: buildBar(usedRam, totalRam),
            hostname: os.hostname()
        },
        ping: pingMs
    };
};

const formatSystemInfo = (info) => [
    `╭━━━「 *⚡ XBAIL INFO* 」`,
    `┃`,
    `┃  📦 *Library*`,
    `┃  ├ ${info.library.name} v${info.library.version}`,
    `┃  ├ WA  : ${info.library.waVersion}`,
    `┃  └ By  : ${info.library.author}`,
    `┃`,
    `┃  🚀 *Runtime*`,
    `┃  ├ Node : ${info.runtime.node}`,
    `┃  ├ OS   : ${info.runtime.platform}`,
    `┃  └ Up   : ${info.runtime.uptime}`,
    `┃`,
    `┃  💾 *Memory*`,
    `┃  ├ Heap : ${info.memory.heapUsed}/${info.memory.heapTotal} MB`,
    `┃  ├ ${info.memory.heapBar}`,
    `┃  └ RSS  : ${info.memory.rss} MB`,
    `┃`,
    `┃  🖥️  *System*`,
    `┃  ├ CPU  : ${info.system.cpus}x ${info.system.cpuModel.slice(0, 26)}`,
    `┃  ├ RAM  : ${info.system.usedRam}/${info.system.totalRam} MB`,
    `┃  └ ${info.system.ramBar}`,
    `┃`,
    `┃  ⚡ *Ping : ${info.ping} ms*`,
    `╰━━━━━━━━━━━━━━━━━━━━━━`,
].join("\n");

module.exports = { getSystemInfo, formatSystemInfo };
