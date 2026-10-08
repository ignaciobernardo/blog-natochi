import{a as e,i as t,o as n,t as r}from"./store.C3IofmED.js";import{g as i,p as a,t as o,u as s}from"./fellows.BEAN6JOO.js";var c=n(`fellows`),l=e().id,u=e().pod,d=[...new Set(c.map(e=>e.pod))].sort(),f=[...new Set(c.map(e=>e.track))].sort(),p=(e,t)=>[`<label class="gs-chip sm"><input type="radio" name="${e}" value="" checked /><span>All</span></label>`,...t.map(t=>`<label class="gs-chip sm"><input type="radio" name="${e}" value="${r(t)}" /><span>${r(t)}${e===`pod`&&t===u?` (yours)`:``}</span></label>`)].join(``);document.querySelector(`[data-pods]`).innerHTML=p(`pod`,d),document.querySelector(`[data-tracks]`).innerHTML=p(`track`,f);var m=e=>/^https?:\/\//i.test(e)?e:`#`;document.querySelector(`[data-templates]`).innerHTML=c.map(e=>{let n=e.project||{};return`<template id="dr-${e.id}" data-title="${r(e.pod)} · ${r(e.track)}">
      <div class="ff-row"><span class="ff-av lg" aria-hidden="true">${r(t(e.name))}</span><div class="ff-stack" style="gap:4px"><h2 class="gs-drawer-h">${r(e.name)}</h2>${e.sample?`<span class="pf-sample">Sample person</span>`:``}</div></div>
      <p class="gs-drawer-lead">${r(e.role)}</p>
      <dl class="gs-kv">
        <dt>Pod</dt><dd>${r(e.pod)}${e.pod===u?` (your pod)`:``}</dd>
        <dt>Track</dt><dd>${r(e.track)}</dd>
        <dt>City</dt><dd>${r(e.city)}</dd>
        <dt>Experience</dt><dd>${r(e.years)} years</dd>
        <dt>Email</dt><dd>${e.sample?`<span class="ff-dim">Hidden for samples</span>`:`<a class="ff-link" href="mailto:${r(e.email)}">${r(e.email)}</a>`}</dd>
      </dl>
      <span class="gs-label">Project</span>
      <p class="ff-h sm" style="margin:0">${r(n.title||`No project yet`)}</p>
      <div class="ff-dr-meta"><span class="pf-chip">${r(n.problem||`—`)}</span><span class="pf-chip">${r(n.stage||`—`)}</span></div>
      <p class="gs-prose">${r(n.summary||``)}</p>
      ${n.looking?`<p class="gs-micro">Looking for: <span style="color:var(--fg-primary)">${r(n.looking)}</span></p>`:``}
      ${(n.links||[]).map(e=>`<a class="ff-link" href="${r(m(e))}" target="_blank" rel="noopener">${r(e)}</a>`).join(``)}
      <a class="gs-btn" href="${a(`projects`)}" style="justify-self:start">All projects</a>
    </template>`}).join(``),o().drawer();var h=document.querySelector(`[data-q]`),g=e=>document.querySelector(`input[name="${e}"]:checked`)?.value||``;function _(){let e=g(`pod`),n=g(`track`),a=h.value.trim().toLowerCase(),f=c.filter(t=>(!e||t.pod===e)&&(!n||t.track===n)&&(!a||`${t.name} ${t.city} ${t.role} ${t.project?.title} ${t.project?.problem}`.toLowerCase().includes(a)));document.querySelector(`[data-count]`).textContent=`${f.length} of ${c.length} people`;let p=[u,...d.filter(e=>e!==u)],m=document.querySelector(`[data-groups]`);m.innerHTML=f.length?p.filter(e=>f.some(t=>t.pod===e)).map(e=>`
      <section class="ff-stack" style="margin-bottom:18px" aria-labelledby="g-${e.replace(/\W/g,``)}">
        <h3 class="gs-label" id="g-${e.replace(/\W/g,``)}" style="margin:6px 0 2px">${r(o().zero(e.toUpperCase()))}${e===u?` <span class="ff-acc">· yours</span>`:``}</h3>
        <div class="ff-cards" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">${f.filter(t=>t.pod===e).map(e=>`
          <button type="button" class="ff-card ff-person${e.id===l?` mine`:``}" data-drawer="dr-${e.id}" aria-label="Open profile: ${r(e.name)}${e.sample?`, sample person`:``}">
            <span class="who"><span class="ff-av" aria-hidden="true">${r(t(e.name))}</span><span><b>${r(e.name)}${e.id===l?` (you)`:``}</b>${i(e.sample)}<small>${r(e.track)} · ${r(e.city)} · ${r(e.years)} yrs</small></span></span>
            <span class="ff-note">${r(e.role)}</span>
            <span class="t" style="font-size:13px;color:var(--fg-primary)">${r(e.project?.title||`No project yet`)}</span>
          </button>`).join(``)}</div>
      </section>`).join(``):`<p class="pf-empty">Nobody matches. Clear a filter to see more.</p>`,s(m)}h.addEventListener(`input`,_),document.querySelectorAll(`input[name="pod"], input[name="track"]`).forEach(e=>e.addEventListener(`change`,_)),_();