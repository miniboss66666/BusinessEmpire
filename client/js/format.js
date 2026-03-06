/* ============================================
   FORMAT.JS - Format số tiền
   ============================================ */

const Format = (() => {

  // Format theo K/M/B/Q
  function shorthand(n) {
    if (n === null || n === undefined || isNaN(n)) return '$0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';

    if (abs >= 1e15) return sign + '$' + (abs / 1e15).toFixed(2) + 'Q';
    if (abs >= 1e12) return sign + '$' + (abs / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9)  return sign + '$' + (abs / 1e9).toFixed(2)  + 'B';
    if (abs >= 1e6)  return sign + '$' + (abs / 1e6).toFixed(2)  + 'M';
    if (abs >= 1e3)  return sign + '$' + (abs / 1e3).toFixed(2)  + 'K';
    return sign + '$' + abs.toFixed(2);
  }

  // Format theo Scientific (e9, e10...)
  function scientific(n) {
    if (n === null || n === undefined || isNaN(n)) return '$0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';

    if (abs < 1e6) return shorthand(n); // Dưới 1M vẫn dùng shorthand cho dễ đọc
    const exp = Math.floor(Math.log10(abs));
    const base = (abs / Math.pow(10, exp)).toFixed(2);
    return sign + '$' + base + 'e' + exp;
  }

  // Format chính - tự động chọn theo settings
  function money(n) {
    const fmt = STATE?.settings?.numberFormat || 'shorthand';
    return fmt === 'scientific' ? scientific(n) : shorthand(n);
  }

  // Format số nguyên không có $
  function number(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    if (n >= 1e9)  return (n / 1e9).toFixed(2)  + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(2)  + 'K';
    return Math.floor(n).toString();
  }

  // Format thời gian (ms → "2h 30m 15s")
  function time(ms) {
    if (!ms || ms <= 0) return '0s';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);

    if (h > 0) return h + 'h ' + (m % 60) + 'm';
    if (m > 0) return m + 'm ' + (s % 60) + 's';
    return s + 's';
  }

  // Format % (làm tròn 1 chữ số)
  function percent(n) {
    return (n || 0).toFixed(1) + '%';
  }

  return { money, number, time, percent, shorthand, scientific };

})();