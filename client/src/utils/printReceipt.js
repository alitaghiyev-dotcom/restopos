export function printReceipt(data, type = 'customer') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  const dateStr = new Date().toLocaleString('tr-TR');

  let itemsHtml = '';
  if (data.items) {
    data.items.forEach(item => {
      if (type === 'kitchen') {
        itemsHtml += `
          <div class="item">
            <div class="item-name">${item.quantity}x ${item.product_name}</div>
            ${item.notes ? `<div class="item-note">Not: ${item.notes}</div>` : ''}
          </div>
        `;
      } else {
        itemsHtml += `
          <div class="item">
            <div class="item-name">${item.quantity}x ${item.product_name}</div>
            <div class="item-price">${(item.quantity * item.unit_price).toFixed(2)} TL</div>
          </div>
        `;
      }
    });
  }

  const html = `
    <html>
      <head>
        <style>
          @page { margin: 0; }
          body { 
            font-family: monospace; 
            margin: 0; 
            padding: 10px; 
            width: 80mm; 
            color: #000;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .title { font-size: 16px; font-weight: bold; }
          .subtitle { font-size: 12px; margin-top: 2px; }
          .item { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 4px; font-size: 12px; }
          .item-name { width: 70%; font-weight: bold; }
          .item-price { width: 30%; text-align: right; }
          .item-note { width: 100%; font-size: 11px; padding-left: 15px; font-style: italic; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          .totals { text-align: right; font-size: 14px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; font-size: 11px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${type === 'kitchen' ? 'MUTFAK FİŞİ' : data.restaurant_name || 'RestoPos'}</div>
          <div class="subtitle">Masa: ${data.table_number || '-'}</div>
          <div class="subtitle">Tarih: ${dateStr}</div>
          <div class="subtitle">Garson: ${data.waiter_name || '-'}</div>
        </div>
        
        <div class="items">
          ${itemsHtml}
        </div>
        
        ${type === 'customer' ? `
          <div class="divider"></div>
          <div class="totals">
            <div>Ara Toplam: ${(data.subtotal || 0).toFixed(2)} TL</div>
            ${data.discount > 0 ? `<div>İndirim: -${data.discount.toFixed(2)} TL</div>` : ''}
            <div>TOPLAM: ${(data.total || 0).toFixed(2)} TL</div>
          </div>
        ` : ''}
        
        <div class="footer">
          ${type === 'customer' ? 'Bizi tercih ettiğiniz için teşekkür ederiz!' : 'Lütfen dikkatli hazırlayınız.'}
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
