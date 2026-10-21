/* V3.4 display currency selector: AED / USD / SAR */
(function(){
  const $=id=>document.getElementById(id);
  const BASE_AED_PER_USD=3.6725, SAR_PER_USD=3.75;
  const CURRENCIES={
    AED:{code:'AED',factor:1,decimals:0},
    USD:{code:'USD',factor:1/BASE_AED_PER_USD,decimals:2},
    SAR:{code:'SAR',factor:SAR_PER_USD/BASE_AED_PER_USD,decimals:2}
  };
  let currency='AED';
  const cfg=()=>CURRENCIES[currency]||CURRENCIES.AED;
  const convert=aed=>(Number(aed)||0)*cfg().factor;
  function numberText(aed){const c=cfg();return convert(aed).toLocaleString('en-US',{minimumFractionDigits:c.decimals,maximumFractionDigits:c.decimals})}
  const money=aed=>`${cfg().code} ${numberText(aed)}`;

  window.quoteDetailCurrency=aed=>`${cfg().code} ${convert(aed).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  function loadCurrency(){try{const x=localStorage.getItem('jq_display_currency_v34');currency=CURRENCIES[x]?x:'AED'}catch(e){currency='AED'}}
  function saveCurrency(){try{localStorage.setItem('jq_display_currency_v34',currency)}catch(e){}}
  function setVersion(){const v=document.querySelector('.version');/* Core page owns its version label. */}

  function injectStyle(){
    if($('currencyV34Style'))return;
    const s=document.createElement('style');s.id='currencyV34Style';
    s.textContent=`
      .currency-card{background:#fff;border:1px solid var(--line);border-radius:17px;padding:14px 16px;margin-bottom:12px}
      .currency-head strong{font-size:15px}.currency-head small{display:block;color:var(--muted);font-size:10px;line-height:1.45;margin-top:3px}
      .currency-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:11px}
      .currency-seg button{height:40px;border:1px solid var(--line);border-radius:10px;background:#fff;font-weight:800;color:#555}
      .currency-seg button.active{background:#111;color:#fff;border-color:#111}
      .currency-mini{margin:10px 0 12px}
      .currency-metric{padding:19px;background:linear-gradient(135deg,#111317,#282a2f);color:#fff;border-radius:17px;margin-bottom:12px}
      .currency-metric small{color:#b8bcc4}.currency-metric .num{font-size:34px;font-weight:900;margin-top:4px;letter-spacing:-1px;overflow-wrap:anywhere}
      .currency-metric .sale{margin-top:14px;padding-top:14px;border-top:1px solid #3b3d42}.currency-metric .sale .num{color:#ead7a7}
      @media(max-width:560px){.currency-metric .num{font-size:29px}}
    `;
    document.head.appendChild(s);
  }

  function selectorHtml(compact=false){
    return `<div class="${compact?'currency-card currency-mini':'currency-card'}" data-currency-selector>
      <div class="currency-head"><strong>最终展示货币</strong><small>只改变最终金额和客户报价展示，不改变内部 RMB→AED 成本模型。</small></div>
      <div class="currency-seg">${['AED','USD','SAR'].map(c=>`<button type="button" data-currency="${c}">${c}</button>`).join('')}</div>
    </div>`;
  }

  function installSelectors(){
    const metric=document.querySelector('#calc .metric');
    if(metric&&!document.querySelector('#calc [data-currency-selector]')){
      metric.insertAdjacentHTML('beforebegin',selectorHtml(false));
      metric.style.display='none';
      const box=document.createElement('div');box.id='currencyMetric';box.className='currency-metric';
      metric.insertAdjacentElement('afterend',box);
    }
    const info=$('customerInfoCard');
    if(info&&!document.querySelector('#quote [data-currency-selector]'))info.insertAdjacentHTML('beforebegin',selectorHtml(true));
    document.querySelectorAll('[data-currency-selector] button[data-currency]').forEach(btn=>btn.addEventListener('click',()=>setCurrency(btn.dataset.currency)));
  }

  function syncButtons(){
    document.querySelectorAll('[data-currency-selector] button[data-currency]').forEach(btn=>btn.classList.toggle('active',btn.dataset.currency===currency));
  }

  function renderCurrencyMetric(r){
    const box=$('currencyMetric');if(!box||!r)return;
    box.innerHTML=`<small>单件 ${cfg().code} 成本</small><div class="num">${money(r.aed)}</div><div class="sale"><small>单件销售价</small><div class="num">${money(r.sale)}</div></div>`;
    if($('salesOrderOut'))$('salesOrderOut').textContent=money(r.totalSale);
  }

  function renderHomeBanner(){
    const meta=$('uxHomeQuoteMeta');if(!meta||!window.quoteSession?.active)return;
    const t=typeof window.cartTotals==='function'?window.cartTotals():{qty:0,total:0};
    meta.textContent=`${window.quoteCart?.length||0} 款 / ${t.qty} 件 · ${money(t.total||0)} · 未完成`;
  }

  function renderCartPrices(){
    const cards=[...document.querySelectorAll('#quoteItems .item-card')];
    cards.forEach((card,i)=>{const x=window.quoteCart?.[i],p=card.querySelector('.item-price');if(x&&p)p.textContent=money(x.total)});
  }

  function renderCustomerQuote(){
    if(typeof window.effectiveQuoteItems!=='function')return;
    const items=window.effectiveQuoteItems(),rows=[...document.querySelectorAll('#qItemsBody tr')];
    rows.forEach((tr,i)=>{const x=items[i],cells=tr.children;if(!x||cells.length<4)return;cells[2].textContent=money(x.unit);cells[3].innerHTML=`<strong>${money(x.total)}</strong>`});
    rows.forEach((tr,i)=>{
      const item=items[i];if(!item)return;
      const options=typeof window.quoteLightOptions==='function'?window.quoteLightOptions(item):[];
      tr.querySelectorAll('.q-compare-row b').forEach((el,j)=>{const unit=j===0?item.unit:options[j-1]?.unit;if(unit!=null)el.textContent=money(unit)+' / pc'});
      const subtotals=tr.querySelectorAll('.q-product-total strong');
      if(subtotals[0])subtotals[0].textContent=money(item.total);
      if(subtotals[1]&&options[0])subtotals[1].textContent=money(options[0].unit*Number(item.qty||0));
    });
    if(typeof window.versionTotals==='function'){
      const versions=window.versionTotals(items);
      if($('qPlanTotal'))$('qPlanTotal').textContent=versions.hasPlan?money(versions.planA):'';
    }
    rows.forEach((tr,i)=>{if(items[i]&&typeof window.renderPriceBreakdown==='function'){const el=tr.querySelector('.q-price-details');if(el)el.outerHTML=window.renderPriceBreakdown(items[i]);}});
    const total=items.reduce((s,x)=>s+(Number(x.total)||0),0);
    if($('qGrandTotal'))$('qGrandTotal').textContent=numberText(total);
    const grand=$('qGrandTotal')?.parentElement;
    if(grand){[...grand.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim())n.textContent=cfg().code+' '})}
    const meta=[...document.querySelectorAll('#customerQuote .qmeta div')].find(d=>d.querySelector('span')?.textContent.trim()==='Currency');
    if(meta){const strong=meta.querySelector('strong');if(strong)strong.textContent=cfg().code}
  }

  function renderSim(){
    if(!window.simWeights||typeof window.simCalc!=='function')return;
    window.simWeights.forEach((w,i)=>{if(w===null||!Number.isFinite(Number(w)))return;const row=document.querySelector(`[data-sim-row="${i}"]`);if(!row)return;const r=window.simCalc(Number(w));const cost=row.querySelector('[data-sim-cost]'),sale=row.querySelector('[data-sim-sale]');if(cost)cost.textContent=money(r.aed);if(sale)sale.textContent=money(r.sale)});
  }

  function annotateNewestHistory(){
    try{const a=JSON.parse(localStorage.getItem('jq_history')||'[]');if(!a.length)return;a[0].displayCurrency=currency;a[0].displayTotal=convert(a[0].total);localStorage.setItem('jq_history',JSON.stringify(a))}catch(e){}
  }

  function renderHistoryCurrency(){
    let a=[];try{a=JSON.parse(localStorage.getItem('jq_history')||'[]')}catch(e){}
    [...document.querySelectorAll('#historyList .history-item')].forEach((row,i)=>{
      const x=a[i],price=row.querySelector('.hist-price');if(!x||!price)return;
      const code=CURRENCIES[x.displayCurrency]?x.displayCurrency:'AED',c=CURRENCIES[code];
      const val=x.displayCurrency&&Number.isFinite(Number(x.displayTotal))?Number(x.displayTotal):(Number(x.total)||0);
      price.textContent=`${code} ${val.toLocaleString('en-US',{minimumFractionDigits:c.decimals,maximumFractionDigits:c.decimals})}`;
    });
  }

  function refreshAll(r){syncButtons();renderCurrencyMetric(r||window.__currencyLastCalc);renderHomeBanner();renderCartPrices();renderCustomerQuote();renderSim();renderHistoryCurrency()}
  function setCurrency(code){if(!CURRENCIES[code])return;currency=code;saveCurrency();refreshAll();window.showFlowToast?.(`最终展示货币：${code}`)}

  function wrapCore(){
    const baseCalc=window.calculate;
    if(typeof baseCalc==='function')window.calculate=function(...args){const r=baseCalc.apply(this,args);window.__currencyLastCalc=r;requestAnimationFrame(()=>refreshAll(r));return r};

    const baseBuild=window.buildQuote;
    if(typeof baseBuild==='function')window.buildQuote=function(...args){const r=baseBuild.apply(this,args);requestAnimationFrame(renderCustomerQuote);return r};

    const baseItems=window.renderQuoteItems;
    if(typeof baseItems==='function')window.renderQuoteItems=function(...args){const r=baseItems.apply(this,args);requestAnimationFrame(()=>{renderCartPrices();renderHomeBanner()});return r};

    const baseHistory=window.renderHistory;
    if(typeof baseHistory==='function')window.renderHistory=function(...args){const r=baseHistory.apply(this,args);requestAnimationFrame(renderHistoryCurrency);return r};

    const baseSave=window.saveQuote;
    if(typeof baseSave==='function')window.saveQuote=function(...args){const r=baseSave.apply(this,args);if(r){annotateNewestHistory();requestAnimationFrame(renderHistoryCurrency)}return r};

    const baseBegin=window.beginNewQuote;
    if(typeof baseBegin==='function')window.beginNewQuote=function(...args){currency='AED';saveCurrency();const r=baseBegin.apply(this,args);requestAnimationFrame(()=>refreshAll());return r};

    const baseFinish=window.finishQuote;
    if(typeof baseFinish==='function')window.finishQuote=function(...args){const r=baseFinish.apply(this,args);currency='AED';saveCurrency();requestAnimationFrame(()=>refreshAll());return r};

    const baseUpdateSim=window.updateSim;
    if(typeof baseUpdateSim==='function')window.updateSim=function(...args){const r=baseUpdateSim.apply(this,args);requestAnimationFrame(renderSim);return r};

    const baseShare=window.makeShareImage;
    if(typeof baseShare==='function'){
      window.makeShareImage=async function(...args){
        const originalItems=window.effectiveQuoteItems,proto=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,originalFillText=proto&&proto.fillText;
        try{
          if(typeof originalItems==='function')window.effectiveQuoteItems=function(){return originalItems().map(x=>({...x,unit:convert(x.unit),total:convert(x.total),lightweightOptions:(x.lightweightOptions||[]).map(o=>({...o,unit:convert(o.unit)}))}))};
          if(proto&&originalFillText)proto.fillText=function(text,...rest){if(typeof text==='string')text=text.replace(/\bAED\b/g,cfg().code);return originalFillText.call(this,text,...rest)};
          return await baseShare.apply(this,args);
        }finally{
          if(typeof originalItems==='function')window.effectiveQuoteItems=originalItems;
          if(proto&&originalFillText)proto.fillText=originalFillText;
        }
      };
    }
  }

  function install(){
    loadCurrency();injectStyle();installSelectors();setVersion();wrapCore();
    const r=typeof window.calculate==='function'?window.calculate():null;window.__currencyLastCalc=r;refreshAll(r);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();