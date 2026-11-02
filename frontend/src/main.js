import './style.css';
import { boot } from './app.js';

/* ---------------- 页面生命周期：心跳 + 关闭通知 ----------------
 * 本地服务据此判断页面是否仍在线；最后一个页面关闭后服务自动退出，
 * 避免关闭浏览器后后台仍残留进程。 */
const CID = (self.crypto && self.crypto.randomUUID)
  ? self.crypto.randomUUID()
  : 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2);

function ping() {
  try {
    fetch('/api/ping?cid=' + encodeURIComponent(CID), {
      method: 'POST', keepalive: true, cache: 'no-store'
    });
  } catch (e) { /* 服务已退出等情况忽略 */ }
}

function bye() {
  const url = '/api/bye?cid=' + encodeURIComponent(CID);
  try {
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else fetch(url, { method: 'POST', keepalive: true });
  } catch (e) { /* ignore */ }
}

window.addEventListener('pagehide', (e) => { if (!e.persisted) bye(); });
window.addEventListener('pageshow', () => ping());
document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
setInterval(ping, 5000);
ping();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
