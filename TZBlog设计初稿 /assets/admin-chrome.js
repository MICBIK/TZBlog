/* ──────────────────────────────────────────────────────────────
   admin-chrome.js — single source of truth for the admin sidebar.
   Replaces each page's hand-written <aside> (5 used .side+.ic, the
   editor used .nav+.dot, and "板块与置顶" was missing on 4 of 6) with
   ONE canonical nav, auto-highlighting the current screen by filename.
   Change the menu here once; all 6 admin pages stay in lockstep.
   ────────────────────────────────────────────────────────────── */
(function(){
  var NAV=[
    ['概览',[['仪表盘','▦','admin-dashboard.html'],['数据分析','∿','admin-analytics.html']]],
    ['内容',[['写文章','✎','admin-editor.html'],['板块与置顶','▤','admin-sections.html'],['媒体库','⊞','admin-media.html']]],
    ['系统',[['站点设置','⚙','admin-settings.html'],['查看前台','↗','front-home.html']]]
  ];
  function build(cur){
    var h='<div class="ac-brand"><span class="d"></span><b>tzblog</b><span>/admin</span></div><nav>';
    NAV.forEach(function(g){
      h+='<div class="ac-grp">'+g[0]+'</div>';
      g[1].forEach(function(it){
        var on=(it[2]===cur)?' on':'';
        h+='<a class="ac-it'+on+'" href="'+it[2]+'"><span class="ac-ic">'+it[1]+'</span>'+it[0]+'</a>';
      });
    });
    h+='</nav><div class="ac-me"><span class="av">H</span><div><div class="nm">haiden</div><div class="rl">站长</div></div></div>';
    return h;
  }
  function init(){
    var side=document.querySelector('aside.side,aside.nav,aside.ac-side');
    if(!side) return;
    var cur=location.pathname.split('/').pop()||'admin-dashboard.html';
    side.classList.add('ac-side');
    side.removeAttribute('id');
    side.innerHTML=build(cur);
    if(!document.getElementById('ac-burger')){
      var b=document.createElement('button');
      b.id='ac-burger';b.type='button';b.textContent='≡';b.setAttribute('aria-label','切换侧边栏');
      b.addEventListener('click',function(){side.classList.toggle('open');});
      document.body.appendChild(b);
    }
  }
  if(document.readyState!=='loading') init(); else addEventListener('DOMContentLoaded',init);
})();
