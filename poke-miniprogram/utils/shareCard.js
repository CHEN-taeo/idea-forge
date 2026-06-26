function drawShare(card, ctx, w, h) {
  ctx.setFillStyle('#0f1117');
  ctx.fillRect(0, 0, w, h);
  ctx.setFillStyle('#7c5cff');
  ctx.setFontSize(22);
  ctx.fillText('破壳 · 校园信息差', 60, 80);
  ctx.setFillStyle('#37e0c6');
  ctx.setFontSize(20);
  ctx.fillText(card.eventType || card.cat || '活动', 60, 180);
  ctx.setFillStyle('#eef1f7');
  ctx.setFontSize(28);
  ctx.fillText((card.title || '').slice(0, 20), 60, 230);
  ctx.setFillStyle('#9aa3b2');
  ctx.setFontSize(20);
  ctx.fillText((card.summary || '').slice(0, 40), 60, 300);
  if (card.deadline) {
    ctx.setFillStyle('#ffb454');
    ctx.fillText('⏰ ' + card.deadline, 60, h - 220);
  }
  ctx.setFillStyle('#6b7280');
  ctx.setFontSize(18);
  ctx.fillText('#破壳', 60, h - 100);
}

function exportCanvas(canvasId, page) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    }, page);
  });
}

function saveAndShare(tempPath) {
  wx.saveImageToPhotosAlbum({
    filePath: tempPath,
    success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => wx.previewImage({ urls: [tempPath] })
  });
}

module.exports = { drawShare, exportCanvas, saveAndShare };
