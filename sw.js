/* ST国試トレーナー オフライン用プログラム（Service Worker）
   ・一度開くと、問題・画像・キャラクターをスマホ内に保存し、電波がなくても使えるようにします。
   ・アプリを更新したときは、下の VERSION の数字を変えてアップロードすると、全員の端末で入れ替わります。 */
const VERSION = 'st-trainer-v3.2-20261022';
const CORE = ["./", "index.html", "bank.js", "school.js", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "chara/animal1_praise.webp", "chara/animal2_praise-hint.webp", "chara/animal3_cheer.webp", "chara/animal4_praise.webp", "chara/student1_happy-idea.webp", "chara/student2_normal.webp", "chara/student3_happy-combo.webp", "chara/student4_normal-think.webp", "chara/student5_happy.webp", "chara/student6_normal-think.webp", "chara/student7_combo-happy.webp", "chara/student8_sad.webp", "chara/student9_sad.webp", "chara/support1_cheer.webp", "chara/support2_hint.webp", "chara/support3_hint.webp", "chara/support4_cheer-hint.webp", "chara/support5_cheer.webp", "chara/teacher1_explain.webp", "chara/teacher2_explain.webp", "chara/teacher3_explain.webp", "chara/teacher4_explain.webp"];
const IMAGES = ["img/15AM012_1.jpg", "img/15AM023_1.jpg", "img/15AM066_1.jpg", "img/15AM069_1.jpg", "img/15AM069_2.jpg", "img/15AM093_1.jpg", "img/15PM019_1.jpg", "img/15PM098_1.jpg", "img/16AM013_1.jpg", "img/16AM070_1.jpg", "img/16PM021_1.jpg", "img/16PM068_1.jpg", "img/16PM096_1.jpg", "img/17AM019_1.jpg", "img/17AM078_1.jpg", "img/17PM040_1.jpg", "img/17PM085_1.jpg", "img/17PM094_1.jpg", "img/18AM076_1.jpg", "img/18PM020_1.jpg", "img/18PM040_1.jpg", "img/18PM075_1.jpg", "img/18PM086_1.jpg", "img/18PM087_1.jpg", "img/18PM098_1.jpg", "img/19AM077_1.jpg", "img/19PM040_1.jpg", "img/19PM067_1.jpg", "img/20AM040_1.jpg", "img/20AM041_1.jpg", "img/20AM060_1.jpg", "img/20AM076_1.jpg", "img/20AM094_1.jpg", "img/20PM011_1.jpg", "img/20PM020_1.jpg", "img/20PM040_1.jpg", "img/20PM058_1.jpg", "img/20PM075_1.jpg", "img/20PM098_1.jpg", "img/21AM041_1.jpg", "img/21AM084_1.jpg", "img/21P039_extra.jpg", "img/21PM023_1.jpg", "img/21PM035_1.jpg", "img/21PM070_1.jpg", "img/21PM085_1.jpg", "img/21PM096_1.jpg", "img/22AM015_1.jpg", "img/22AM040_1.jpg", "img/22AM042_1.jpg", "img/22AM072_1.jpg", "img/22PM035_1.jpg", "img/22PM040_1.jpg", "img/22PM059_1.jpg", "img/22PM061_1.jpg", "img/22PM068_1.jpg", "img/22PM098_1.jpg", "img/23AM021_1.jpg", "img/23AM025_1.jpg", "img/23AM041_1.jpg", "img/23AM096_1.jpg", "img/23AM099_1.jpg", "img/23PM023_1.jpg", "img/23PM024_1.jpg", "img/23PM040_1.jpg", "img/23PM099_1.jpg", "img/24AM041_1.jpg", "img/24AM054_1.jpg", "img/24AM072_1.jpg", "img/24AM076_1.jpg", "img/24PM016_1.jpg", "img/24PM040_1.jpg", "img/25AM041_1.jpg", "img/25PM040_1.jpg", "img/26PM019_1.jpg", "img/26PM097_1.jpg", "img/27AM094_1.jpg", "img/27PM098_1.jpg"];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache:'reload' }))));
    await Promise.allSettled(IMAGES.map(u => c.add(u)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for(const k of await caches.keys()) if(k !== VERSION && k.startsWith('st-trainer-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
async function networkFirst(req, key){
  const c = await caches.open(VERSION);
  try{
    const res = await Promise.race([fetch(req), timeout(4000)]);
    if(res && res.ok) c.put(key || req, res.clone());
    return res;
  }catch(e){
    return (await c.match(key || req, { ignoreSearch:true })) || (await c.match('index.html')) || Response.error();
  }
}
async function staleWhileRevalidate(req){
  const c = await caches.open(VERSION);
  const hit = await c.match(req, { ignoreSearch:true });
  const net = fetch(req).then(res => { if(res && res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
async function cacheFirst(req){
  const c = await caches.open(VERSION);
  const hit = await c.match(req, { ignoreSearch:true });
  if(hit) return hit;
  const res = await fetch(req); if(res && res.ok) c.put(req, res.clone()); return res;
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== location.origin) return;   // Googleフォームなど外部への通信には関与しない
  if(req.mode === 'navigate') return e.respondWith(networkFirst(req, /\/(index\.html)?$/.test(url.pathname) ? 'index.html' : null));
  if(/\/school\.js$/.test(url.pathname)) return e.respondWith(networkFirst(req, 'school.js'));   // 提出先は常に最新を優先
  if(/\.(js|webmanifest|json)$/.test(url.pathname)) return e.respondWith(staleWhileRevalidate(req));
  e.respondWith(cacheFirst(req));
});
