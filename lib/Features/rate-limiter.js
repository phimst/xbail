"use strict";

/**
 * Simple per-JID rate limiter
 * Mencegah bot kirim terlalu cepat ke JID yang sama
 */
class RateLimiter {
    constructor({ maxPerMinute = 20, minDelayMs = 500 } = {}) {
        this.maxPerMinute = maxPerMinute;
        this.minDelayMs = minDelayMs;
        /** @type {Map<string, number[]>} jid → array of timestamps */
        this._buckets = new Map();
    }

    /**
     * Cek apakah JID boleh kirim sekarang
     * @param {string} jid
     * @returns {boolean}
     */
    isAllowed(jid) {
        const now = Date.now();
        const window = 60_000; // 1 menit
        const timestamps = (this._buckets.get(jid) || []).filter(t => now - t < window);
        this._buckets.set(jid, timestamps);
        return timestamps.length < this.maxPerMinute;
    }

    /**
     * Catat satu pengiriman ke JID
     * @param {string} jid
     */
    record(jid) {
        const now = Date.now();
        const timestamps = this._buckets.get(jid) || [];
        timestamps.push(now);
        this._buckets.set(jid, timestamps);
    }

    /**
     * Tunggu sampai boleh kirim (enforce minDelayMs)
     * @param {string} jid
     * @returns {Promise<void>}
     */
    async throttle(jid) {
        const lastTs = (this._buckets.get(jid) || []).at(-1) || 0;
        const elapsed = Date.now() - lastTs;
        if (elapsed < this.minDelayMs) {
            await new Promise(r => setTimeout(r, this.minDelayMs - elapsed));
        }
    }

    /**
     * Berapa pesan yang sudah terkirim ke JID dalam 1 menit terakhir
     * @param {string} jid
     * @returns {number}
     */
    count(jid) {
        const now = Date.now();
        return (this._buckets.get(jid) || []).filter(t => now - t < 60_000).length;
    }

    /** Reset semua bucket */
    reset() {
        this._buckets.clear();
    }
}

// Instance global — dipakai di seluruh library
const globalRateLimiter = new RateLimiter();

module.exports = { RateLimiter, globalRateLimiter };
