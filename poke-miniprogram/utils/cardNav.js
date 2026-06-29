function open(id) {
  if (!id) return;
  wx.navigateTo({ url: '/pages/detail/detail?id=' + encodeURIComponent(id) });
}

function onCardTap(e) {
  open(e.currentTarget.dataset.id);
}

module.exports = { open, onCardTap };
