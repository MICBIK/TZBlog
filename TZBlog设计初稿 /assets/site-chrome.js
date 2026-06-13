/* ──────────────────────────────────────────────────────────────
   site-chrome.js — single source of truth for shared footer +
   background motion + glow cursor + click ripple. Loaded with
   `defer` from <head>; normalizes any <footer> on the page so the
   7 divergent footer formats collapse to one canonical markup.
   ────────────────────────────────────────────────────────────── */
(function(){
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var coarse = matchMedia('(hover:none),(pointer:coarse)').matches;

  function el(tag, cls, html){var n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;}

  // ── canonical footer (THE single source of truth) ──────────────
  var FOOTER = '\
<div class="sf-main">\
  <div class="sf-brand">\
    <div class="bp">haiden@tzblog:<span style="color:var(--fg-strong)">~</span> $</div>\
    <p>中文优先的技术与生活博客，记录 AI Coding、全栈工程、工具效率、随笔与作品。由热爱驱动，记录即复利。</p>\
    <div class="sf-soc">\
      <a href="javascript:void(0)" data-msg="GitHub: github.com/haiden" title="GitHub">⌨</a>\
      <a href="javascript:void(0)" data-msg="X: @haiden_dev" title="X">✕</a>\
      <a href="javascript:void(0)" data-msg="RSS: tzcode.top/rss.xml" title="RSS">⟳</a>\
      <a href="javascript:void(0)" data-msg="邮箱：hi@tzcode.top" title="Email">✉</a>\
    </div>\
  </div>\
  <div class="sf-col"><h5>导航</h5>\
    <a href="front-home.html">首页</a><a href="front-search.html">搜索</a>\
    <a href="front-pathways.html">学习路径</a><a href="front-works.html">作品</a>\
    <a href="front-library.html">归档书架</a><a href="front-about.html">关于</a>\
  </div>\
  <div class="sf-col"><h5>账户</h5>\
    <a href="auth.html">登录 / 注册</a><a href="account.html">个人中心</a>\
    <a href="landing.html">项目主页</a>\
  </div>\
  <div class="sf-col"><h5>分类</h5>\
    <a href="front-search.html">AI Coding</a><a href="front-search.html">全栈工程</a>\
    <a href="front-search.html">工具效率</a><a href="front-search.html">随笔思考</a>\
    <a href="front-search.html">作品项目</a>\
  </div>\
  <div class="sf-col"><h5>友情链接</h5>\
    <a href="javascript:void(0)" data-msg="外链：阮一峰的网络日志">阮一峰的网络日志</a>\
    <a href="javascript:void(0)" data-msg="外链：云游君">云游君</a>\
    <a href="javascript:void(0)" data-msg="外链：张洪 Heo">张洪 Heo</a>\
    <a href="javascript:void(0)" data-msg="外链：纸鹿摸鱼处">纸鹿摸鱼处</a>\
  </div>\
</div>\
<div class="sf-bottom"><div class="in">\
  <span>© 2026 tzblog · haiden · 保留所有权利</span>\
  <span><a href="javascript:void(0)" data-msg="备案信息：示例备案号">浙ICP备2026000000号-1</a></span>\
  <span class="pw">Powered by <b>Next.js</b> · <b>Go</b> · 部署于 <b>Vercel</b></span>\
</div></div>';

  function initFooter(){
    if(document.body.hasAttribute('data-no-footer')) return;
    var f = document.querySelector('footer');
    if(!f){f=el('footer');document.body.appendChild(f);}
    f.setAttribute('data-site-footer','');
    f.removeAttribute('class');
    f.innerHTML = FOOTER;
  }

  // ── background motion ──────────────────────────────────────────
  function initFx(){
    var fx = el('div'); fx.id='site-fx';
    fx.appendChild(el('div','aurora a1'));
    fx.appendChild(el('div','aurora a2'));
    if(!reduce){
      for(var i=0;i<10;i++){
        var e=el('span','ember');
        e.style.left=(Math.random()*100)+'%';
        e.style.animationDuration=(9+Math.random()*12)+'s';
        e.style.animationDelay=(-Math.random()*16)+'s';
        fx.appendChild(e);
      }
    }
    document.body.appendChild(fx);
  }

  // ── click glyph-fall (random terminal chars drop from click) ───
  function initGlyphs(){
    if(reduce) return;
    var layer = el('div'); layer.id='site-fall'; document.body.appendChild(layer);
    var chars='01{}<>/[]$;:_*#=+-ABCDEFabcdef';
    addEventListener('pointerdown',function(e){
      var n=2+Math.floor(Math.random()*3);
      for(var i=0;i<n;i++){
        var s=el('span',null,chars[Math.floor(Math.random()*chars.length)]);
        s.style.left=(e.clientX+(Math.random()*28-14))+'px';
        s.style.top=(e.clientY+(Math.random()*10-5))+'px';
      s.style.fontSize=(12+Math.random()*8)+'px';
      s.style.animationDelay=(Math.random()*.08)+'s';
        layer.appendChild(s);
     setTimeout((function(node){return function(){node.remove();};})(s),2000);
      }
    });
  }

  // ── data-msg toast (footer social/links) ───────────────────────
  function initToast(){
    addEventListener('click',function(e){
      var t=e.target.closest('[data-msg]'); if(!t) return; e.preventDefault();
      var box=el('div',null,t.getAttribute('data-msg'));
      box.style.cssText='position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:9999;'+
        'background:var(--panel-2);border:1px solid var(--acc-dim);color:var(--fg-strong);'+
        'font-family:var(--mono);font-size:13px;padding:10px 18px;border-radius:6px;'+
        'box-shadow:0 10px 30px -10px rgba(0,0,0,.6);opacity:0;transition:.2s';
      document.body.appendChild(box);
      requestAnimationFrame(function(){box.style.opacity='1';});
      setTimeout(function(){box.style.opacity='0';setTimeout(function(){box.remove();},250);},1800);
    });
  }

  // ── page-load boot animation (injected #site-load, auto-dismiss) ─
  function initLoad(){
    var o=el('div'); o.id='site-load';
o.innerHTML='<div class="box"><div class="ln">$ <b>tzblog</b> ❯ booting<span class="cur"></span></div><div class="bar"><i></i></div></div>';
    document.body.appendChild(o);
    var t0=Date.now();
  function done(){o.classList.add('done');setTimeout(function(){o.remove();},600);}
    if(document.readyState==='complete') setTimeout(done,520);
    else addEventListener('load',function(){setTimeout(done,Math.max(0,520-(Date.now()-t0)));});
  }

  // ── global error toast (window errors + siteChrome.error API) ───
  function showErr(msg){
    var b=document.getElementById('site-err');
    if(!b){b=el('div');b.id='site-err';document.body.appendChild(b);}
    b.textContent='';
    var ic=el('span','ic','⚠'),m=el('span'),x=el('span','x');
    m.textContent=String(msg).slice(0,220); x.setAttribute('data-errx',''); x.textContent='✕';
    b.appendChild(ic);b.appendChild(m);b.appendChild(x);
    requestAnimationFrame(function(){b.classList.add('show');});
    clearTimeout(b._t); b._t=setTimeout(function(){b.classList.remove('show');},6000);
  }
  function initErr(){
    addEventListener('error',function(e){showErr('runtime error: '+(e.message||e.type||'unknown'));});
    addEventListener('unhandledrejection',function(e){showErr('unhandled rejection: '+((e.reason&&e.reason.message)||e.reason||'unknown'));});
    addEventListener('click',function(e){if(e.target.closest('[data-errx]')){var b=document.getElementById('site-err');if(b)b.classList.remove('show');}});
    window.siteChrome={error:showErr};
  }

  function init(){initLoad();initFx();initFooter();initGlyphs();initToast();initErr();}
  if(document.readyState!=='loading') init(); else addEventListener('DOMContentLoaded',init);
})();
