(function () {
  var i = __INDEX__;
  var names = ['Visão Geral', 'Usuários', 'Equipamentos', 'Locações', 'Leilões', 'Contabilidade'];
  var name = names[i];
  var r = document.querySelector('h1') && document.querySelector('h1').parentElement;
  var t = r && Array.from(r.children).find(function (c) {
    return c.querySelectorAll(':scope > button').length === 6;
  });
  var b = t && Array.from(t.querySelectorAll('button')).find(function (x) {
    return (x.innerText || '').trim() === name;
  });
  if (b) b.click();
  return b ? 'ok' : 'no';
})();
