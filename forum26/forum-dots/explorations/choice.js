(function(){
  const F=window.Forum;
  if(!F)return;
  document.querySelectorAll('[data-role-arch]').forEach(el=>{
    F.ArchWindow(el,{scene:el.dataset.roleArch,tone:'night',pitch:5,dot:3.2,animate:false});
  });
})();
