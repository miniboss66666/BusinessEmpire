#!/bin/bash
cat > supabase/functions/price-ticker/index.ts << 'ENDOFFILE'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const STOCKS = [
  { symbol:'AAPL', base:178.5 }, { symbol:'MSFT', base:415.2 },
  { symbol:'GOOGL', base:142.8 }, { symbol:'AMZN', base:185.6 },
  { symbol:'META', base:505.3 }, { symbol:'TSLA', base:172.4 },
  { symbol:'NVDA', base:875.4 }, { symbol:'AMD', base:168.9 },
  { symbol:'INTC', base:43.2 }, { symbol:'NFLX', base:628.7 },
  { symbol:'SHOP', base:78.3 }, { symbol:'HSBC', base:645.2 },
  { symbol:'BP', base:498.1 }, { symbol:'VOD', base:72.4 },
  { symbol:'RIO', base:5120.0 }, { symbol:'7203', base:3250.0 },
  { symbol:'6758', base:12800.0 }, { symbol:'9984', base:7890.0 },
  { symbol:'6861', base:65400.0 }, { symbol:'0700', base:298.4 },
  { symbol:'9988', base:72.15 }, { symbol:'1299', base:58.65 },
  { symbol:'SAP', base:178.9 }, { symbol:'BMW', base:98.45 },
  { symbol:'SIE', base:172.3 }, { symbol:'600519', base:1689.0 },
  { symbol:'601318', base:42.8 }, { symbol:'600036', base:31.25 },
  { symbol:'VNM', base:72400 }, { symbol:'VIC', base:38500 },
  { symbol:'VHM', base:42100 }, { symbol:'FPT', base:128900 },
  { symbol:'MWG', base:52300 }, { symbol:'HPG', base:27800 },
  { symbol:'DYNX', base:411.44 },
];

const CRYPTO_IDS = [
  'bitcoin','ethereum','binancecoin','solana','ripple',
  'tether','usd-coin','cardano','avalanche-2','tron',
  'matic-network','polkadot','chainlink','litecoin','uniswap',
  'near','dogecoin','shiba-inu','pepe','floki',
  'aave','maker','the-sandbox','axie-infinity','decentraland',
  'aptos','arbitrum','optimism',
];

async function updateStockPrices() {
  const { data: latest } = await supabase.from('stock_latest').select('symbol, price');
  const latestMap: Record<string, number> = {};
  latest?.forEach((r: any) => { latestMap[r.symbol] = Number(r.price); });
  const rows = STOCKS.map(s => {
    const prev = latestMap[s.symbol] ?? s.base;
    const change = (Math.random() - 0.48) * 0.03;
    const newPrice = Math.max(prev * 0.5, prev * (1 + change));
    return { symbol: s.symbol, price: parseFloat(newPrice.toFixed(4)) };
  });
  const { error } = await supabase.from('stock_history').insert(rows);
  if (error) console.error('stock insert error:', error.message);
  else console.log('Stock: ' + rows.length + ' rows inserted');
}

async function updateCryptoPrices() {
  const ids = CRYPTO_IDS.join(',');
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd';
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('CoinGecko ' + res.status);
    const data = await res.json();
    const rows = Object.entries(data)
      .filter(([, v]: any) => v?.usd)
      .map(([coin_id, v]: any) => ({ coin_id, price_usd: v.usd }));
    const { error } = await supabase.from('crypto_history').insert(rows);
    if (error) console.error('crypto insert error:', error.message);
    else console.log('Crypto: ' + rows.length + ' coins inserted');
  } catch (e: any) {
    console.error('CoinGecko fetch failed:', e.message);
  }
}

async function cleanup() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await Promise.all([
    supabase.from('stock_history').delete().lt('recorded_at', cutoff),
    supabase.from('crypto_history').delete().lt('recorded_at', cutoff),
  ]);
  console.log('Cleanup done');
}

Deno.serve(async (_req: Request) => {
  try {
    await Promise.all([updateStockPrices(), updateCryptoPrices()]);
    if (new Date().getMinutes() === 0) await cleanup();
    return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
ENDOFFILE
echo "Done! First 3 lines:"
head -3 supabase/functions/price-ticker/index.ts