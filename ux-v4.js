/* V3.3 sales/client mobile UX overlay */
(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

  function updateVersion(){
    const v=qs('.version');
    if(v)v.textContent='V3.3 销售/客户移动端优化';
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
    label.textContent='以下为客户看到的报价预览，内部成本、汇率和销售倍率不会显示。';
    quote.parentNode.insertBefore(label,quote);
  }

  function wrapCanvas(ctx,text,x,y,maxWidth,lineHeight,maxLines){
    const raw=String(text||'');
    let line='',lines=[];
    for(const ch of raw){
      const test=line+ch;
      if(ctx.measureText(test).width>maxWidth&&line){
        lines.push(line);line=ch;
        if(lines.length>=maxLines-1)break;
      }else line=test;
    }
    if(line&&lines.length<maxLines)lines.push(line);
    const shown=lines.join('').length;
    if(shown<raw.length&&lines.length)lines[lines.length-1]=lines[lines.length-1].replace(/…$/,'')+'…';
    lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));
    return Math.max(lineHeight,lines.length*lineHeight);
  }

  function drawContain(ctx,img,x,y,w,h,pad){
    ctx.fillStyle='#fafafa';
    if(typeof roundRect==='function'){roundRect(ctx,x,y,w,h,16);ctx.fill()}else ctx.fillRect(x,y,w,h);
    if(!img)return;
    const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
    if(!iw||!ih)return;
    const scale=Math.min((w-pad*2)/iw,(h-pad*2)/ih),dw=iw*scale,dh=ih*scale;
    ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }

  async function loadImg(src){
    return new Promise(resolve=>{
      if(!src)return resolve(null);
      const im=new Image();
      im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;
    });
  }

  async function safeShareImage(){
    buildQuote();
    const items=effectiveQuoteItems();
    if(!items.length){showFlowToast?.('没有可生成的产品');return}
    const full=document.getElementById('fullQuoteDetails')?.checked!==false;
    const totals=items.reduce((a,x)=>{a.qty+=Number(x.qty)||0;a.total+=Number(x.total)||0;return a},{qty:0,total:0});
    const single=items.length===1,rowH=full?260:210;
    const canvas=document.createElement('canvas');
    canvas.width=1080;
    canvas.height=Math.max(1500,single?(full?1840:1710):720+items.length*rowH+360);
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f6f3ec';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';if(typeof roundRect==='function'){roundRect(ctx,38,38,1004,canvas.height-76,32);ctx.fill()}else ctx.fillRect(38,38,1004,canvas.height-76);

    ctx.fillStyle='#17191d';ctx.font='bold 48px -apple-system,Arial';ctx.fillText((document.getElementById('companyName')?.value||'JEWELRY').slice(0,24),88,120);
    ctx.font='24px -apple-system,Arial';ctx.fillStyle='#777';ctx.fillText('JEWELRY QUOTATION',88,164);
    ctx.font='21px -apple-system,Arial';ctx.fillText(`Customer: ${(document.getElementById('customerName')?.value||'—').slice(0,34)}`,88,207);
    let y=250;

    if(single){
      const item=items[0],img=await loadImg(item.photo||photoData||'');
      drawContain(ctx,img,88,y,904,520,18);y+=565;
      ctx.fillStyle='#17191d';ctx.font='bold 35px -apple-system,Arial';y+=wrapCanvas(ctx,item.product,88,y,900,42,2);
      ctx.font='21px -apple-system,Arial';ctx.fillStyle='#666';ctx.fillText(`${item.metal} · QTY ${item.qty}`,88,y);y+=33;
      if(full){
        ctx.fillText(`Total Weight ${Number(item.totalWeight||0).toFixed(2)}g · Gold Weight ${Number(item.goldWeight||0).toFixed(2)}g`,88,y);y+=31;
        ctx.fillText(`Stone Weight ${Number(item.stoneWeight||0).toFixed(2)}ct · Stone Qty ${Number(item.stoneQty||0)} pcs`,88,y);y+=31;
        if(item.description){y+=wrapCanvas(ctx,`Specification: ${item.description}`,88,y,890,29,2)}
      }else{ctx.fillText(`Gold ${Number(item.goldWeight||0).toFixed(2)}g${Number(item.stoneWeight)>0?' · Stone '+Number(item.stoneWeight).toFixed(2)+'ct':''}`,88,y);y+=34}
      ctx.strokeStyle='#ece7db';ctx.beginPath();ctx.moveTo(88,y+8);ctx.lineTo(992,y+8);ctx.stroke();y+=38;
      ctx.fillStyle='#17191d';ctx.font='bold 25px -apple-system,Arial';ctx.fillText(`Unit AED ${Math.round(Number(item.unit||0)).toLocaleString('en-US')}`,88,y);
      ctx.textAlign='right';ctx.fillText(`Total AED ${Math.round(Number(item.total||0)).toLocaleString('en-US')}`,992,y);ctx.textAlign='left';y+=60;
    }else{
      ctx.fillStyle='#17191d';ctx.font='bold 25px -apple-system,Arial';ctx.fillText('ITEMS',88,y);y+=30;
      for(let i=0;i<items.length;i++){
        const item=items[i],img=await loadImg(item.photo||'');
        drawContain(ctx,img,88,y,154,154,9);
        ctx.fillStyle='#17191d';ctx.font='bold 24px -apple-system,Arial';wrapCanvas(ctx,`${i+1}. ${item.product}`,264,y+28,500,30,2);
        ctx.font='18px -apple-system,Arial';ctx.fillStyle='#6b6f76';ctx.fillText(`${item.metal} · QTY ${item.qty}`,264,y+83);
        let ty=y+111;
        if(full){
          ctx.fillText(`Total ${Number(item.totalWeight||0).toFixed(2)}g · Gold ${Number(item.goldWeight||0).toFixed(2)}g`,264,ty);ty+=27;
          ctx.fillText(`Stone ${Number(item.stoneWeight||0).toFixed(2)}ct · ${Number(item.stoneQty||0)} pcs`,264,ty);ty+=27;
          if(item.description)wrapCanvas(ctx,item.description,264,ty,500,25,2);
        }else ctx.fillText(`Gold ${Number(item.goldWeight||0).toFixed(2)}g`,264,ty);
        ctx.textAlign='right';ctx.fillStyle='#17191d';ctx.font='bold 22px -apple-system,Arial';ctx.fillText(`AED ${Math.round(Number(item.total||0)).toLocaleString('en-US')}`,992,y+38);
        ctx.font='17px -apple-system,Arial';ctx.fillStyle='#777';ctx.fillText(`AED ${Math.round(Number(item.unit||0)).toLocaleString('en-US')} / pc`,992,y+69);ctx.textAlign='left';
        ctx.strokeStyle='#efefef';ctx.beginPath();ctx.moveTo(88,y+rowH-16);ctx.lineTo(992,y+rowH-16);ctx.stroke();y+=rowH;
      }
    }

    y+=12;
    ctx.fillStyle='#f3eee2';if(typeof roundRect==='function'){roundRect(ctx,88,y,904,180,22);ctx.fill()}else ctx.fillRect(88,y,904,180);
    ctx.fillStyle='#777';ctx.font='22px -apple-system,Arial';ctx.fillText(`TOTAL ITEMS  ${items.length}`,126,y+49);ctx.fillText(`TOTAL QTY  ${totals.qty}`,126,y+86);
    ctx.fillStyle='#17191d';ctx.font='bold 55px -apple-system,Arial';ctx.fillText(`AED ${Math.round(totals.total).toLocaleString('en-US')}`,126,y+145);
    const vi=validityInfo(document.getElementById('quoteDate').value,n('validDays'));ctx.fillStyle='#777';ctx.font='20px -apple-system,Arial';ctx.fillText(`Date: ${document.getElementById('quoteDate').value||today()}`,88,y+226);ctx.fillText(`Valid until: ${vi.validUntil}`,540,y+226);
    document.getElementById('shareImage').src=canvas.toDataURL('image/jpeg',.92);
    document.getElementById('shareArea').style.display='block';
    document.getElementById('shareArea').scrollIntoView({behavior:'smooth'});
  }

  function install(){
    updateVersion();installHomeBanner();collapseCostDetails();collapseMarketDetails();labelClientPreview();renderUxState();
    if(typeof window.makeShareImage==='function')window.makeShareImage=safeShareImage;
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