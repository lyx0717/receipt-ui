import { CanvasTexture } from 'three';

/**
 * Draw a dashed separator line on the canvas context.
 */
function dash(ctx, x, y, w) {
  ctx.save();
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a left-aligned label and right-aligned value.
 */
function row(ctx, label, value, y) {
  ctx.textAlign = 'left';
  ctx.fillText(label, 28, y);
  ctx.textAlign = 'right';
  ctx.fillText('$' + value, 484, y);
}

/**
 * Generate a CanvasTexture that looks like a thermal-paper receipt
 * with a realistic shopping list.
 *
 * @returns {CanvasTexture}
 */
export default function createReceiptTexture() {
  const W = 512;
  const H = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // --- Paper background ---
  ctx.fillStyle = '#FCF9F3';
  ctx.fillRect(0, 0, W, H);

  // Grain noise (thermal paper texture)
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(150,140,120,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  ctx.textBaseline = 'top';
  let y = 20;

  // --- Header ---
  ctx.fillStyle = '#222';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FRESH MART', W / 2, y);
  y += 30;

  ctx.font = '13px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('123 Market Street', W / 2, y); y += 16;
  ctx.fillText('San Francisco, CA 94105', W / 2, y); y += 16;
  ctx.fillText('Tel: (415) 555-0199', W / 2, y); y += 28;

  ctx.fillStyle = '#333';
  ctx.font = '12px monospace';
  ctx.fillText('2024-12-15  14:32:18', W / 2, y); y += 15;
  ctx.fillText('Cashier: Sarah  #042', W / 2, y); y += 22;

  // --- Column headers ---
  dash(ctx, 28, y, W - 56); y += 14;
  ctx.font = '11px monospace';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'left';
  ctx.fillText('QTY  ITEM                          PRICE', 28, y);
  y += 18;
  dash(ctx, 28, y, W - 56); y += 12;

  // --- Shopping items ---
  const items = [
    ['1', 'Organic Whole Milk 1gal', '5.49'],
    ['2', 'Sourdough Bread Loaf', '7.98'],
    ['1', 'Free Range Eggs Dozen', '4.29'],
    ['3', 'Granny Smith Apples lb', '4.47'],
    ['1', 'Cheddar Cheese Block 8oz', '3.99'],
    ['2', 'Greek Yogurt 32oz', '8.98'],
    ['1', 'Baby Spinach 5oz', '3.49'],
    ['1', 'Avocado Hass x3', '4.99'],
    ['2', 'Almond Milk 64oz', '9.98'],
    ['1', 'Dark Chocolate Bar 72%', '3.29'],
  ];

  ctx.font = '12px monospace';
  ctx.fillStyle = '#222';

  items.forEach(([qty, name, price]) => {
    ctx.textAlign = 'left';
    ctx.fillText(qty, 28, y);
    ctx.fillText(name, 52, y);
    ctx.textAlign = 'right';
    ctx.fillText('$' + price, W - 28, y);
    y += 18;
  });

  // --- Totals ---
  y += 6;
  dash(ctx, 28, y, W - 56); y += 16;

  row(ctx, 'SUBTOTAL', '55.44', y); y += 18;
  row(ctx, 'TAX (8.625%)', '4.78', y); y += 22;

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#222';
  row(ctx, 'TOTAL', '60.22', y); y += 24;

  ctx.font = '12px monospace';
  ctx.fillStyle = '#555';
  row(ctx, 'VISA ****4829', '60.22', y); y += 18;
  row(ctx, 'CHANGE', '0.00', y); y += 26;

  // --- Footer ---
  dash(ctx, 28, y, W - 56); y += 16;

  ctx.font = '13px monospace';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'center';
  ctx.fillText('Thank you for shopping', W / 2, y); y += 16;
  ctx.fillText('with us!', W / 2, y); y += 24;

  ctx.font = '10px monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Returns within 30 days w/ receipt', W / 2, y); y += 14;
  ctx.fillText('www.freshmart.com', W / 2, y); y += 20;

  // --- Barcode ---
  for (let i = 0; i < 52; i++) {
    ctx.fillStyle = '#333';
    const bw = Math.random() > 0.5 ? 2 : 1;
    ctx.fillRect(100 + i * 6, y, bw, 22);
  }
  y += 28;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('* 0049281736502 *', W / 2, y);

  return new CanvasTexture(canvas);
}
