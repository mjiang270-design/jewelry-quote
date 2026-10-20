/* V3.3 sales/client mobile UX overlay */
(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

  function updateVersion(){
    const v=qs('.version');
    // The core page owns its version label.
  }

  function installHomeBanner(){
    if(document.getElementById('uxHomeCurrent'))return;
    const home=document.getElementById('home');
    const settings=home&&qs('.settings',home);
    if(!home||!settings)return;
    const box=document.createElement('div');
    box.id='uxHomeCurrent';
    box.className='ux-home-current';
    box.innerHTML='<div class="ux-home-current__copy"><strong id="uxHomeQuoteTitle">当前未完成报价</strong><span id="uxHomeQuoteMeta">—</span></div><button class="chip" type="button">继续报价</button>';
    box.querySelector('button').addEventListener('click',()=>openCalcPage());
    home.insertBefore(box,settings);
  }

  function renderUxState(){
    installHomeBanner();
    const box=document.getElementById('uxHomeCurrent');
    if(!box)return;
    const active=!!quoteSession?.active;
    box.classList.toggle('show',active);
    if(active){
      const t=typeof cartTotals==='function'?cartTotals():{qty:0,total:0};
      const no=document.getElementById('quoteNo')?.value||quoteSession.id||'当前报价';
      document.getElementById('uxHomeQuoteTitle').textContent=no;
      document.getElementById('uxHomeQuoteMeta').textContent=`${quoteCart.length} 款 / ${t.qty} 件 · AED ${Math.round(t.total||0).toLocaleString('en-US')} · 未完成`;
    }
  }

  function collapseCostDetails(){
    const gold=document.getElementById('goldCost');
    const card=gold?.closest('.card');
    const rows=card?.querySelector('.rows');
    if(!card||!rows||card.querySelector('.ux-cost-toggle'))return;
    rows.hidden=true;
    const btn=document.createElement('button');
    btn.type='button';btn.className='chip ux-cost-toggle';btn.textContent='展开内部成本明细';
    btn.addEventListener('click',()=>{
      rows.hidden=!rows.hidden;
      btn.textContent=rows.hidden?'展开内部成本明细':'收起内部成本明细';
    });
    const h2=card.querySelector('h2');
    if(h2)h2.insertAdjacentElement('afterend',btn);else card.prepend(btn);
  }

  function collapseMarketDetails(){
    const card=qs('#calc .live-card');
    if(!card||card.querySelector('.ux-market-details'))return;
    const stats=card.querySelector('.live-stats');
    const sw=card.querySelector('.switchline');
    const note=card.querySelector('.source-note');
    if(!stats&&!sw&&!note)return;
    const details=document.createElement('details');
    details.className='ux-market-details';
    details.innerHTML='<summary>行情详情 / 自动刷新 ▾</summary><div class="ux-market-details__body"></div>';
    const body=details.querySelector('.ux-market-details__body');
    [stats,sw,note].forEach(el=>{if(el)body.appendChild(el)});
    card.appendChild(details);
  }

  function labelClientPreview(){
    const quote=document.getElementById('customerQuote');
    if(!quote||quote.previousElementSibling?.classList.contains('ux-client-label'))return;
    const label=document.createElement('div');
    label.className='ux-client-label';
    label.textContent='以下为客户报价预览：显示已填写的单件费用明细，未填写或为 0 的项目不显示。';
    quote.parentNode.insertBefore(label,quote);
  }

  function install(){
    updateVersion();installHomeBanner();collapseCostDetails();collapseMarketDetails();labelClientPreview();renderUxState();
    ['updateQuoteSessionUI','renderQuoteItems','beginNewQuote','finishQuote','removeQuoteItem','clearQuoteItems','saveCurrentAndGoCustomer'].forEach(name=>{
      const original=window[name];
      if(typeof original!=='function')return;
      window[name]=function(...args){
        const result=original.apply(this,args);
        requestAnimationFrame(renderUxState);
        return result;
      };
    });
    const originalAdd=window.addCurrentItem;
    if(typeof originalAdd==='function'){
      window.addCurrentItem=function(...args){
        const result=originalAdd.apply(this,args);
        requestAnimationFrame(()=>{
          renderUxState();
          if(result){
            const p=document.getElementById('product');
            p?.scrollIntoView({behavior:'smooth',block:'center'});
            setTimeout(()=>p?.focus({preventScroll:true}),300);
          }
        });
        return result;
      };
    }
    window.addEventListener('resize',()=>document.body.classList.toggle('ux-small',window.innerWidth<430));
    document.body.classList.toggle('ux-small',window.innerWidth<430);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();