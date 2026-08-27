import { jsPDF } from 'jspdf'

const TYPE_TITLE = {
  SUITABILITY: 'Land Suitability Report',
  DISEASE:     'Disease Detection Report',
  IRRIGATION:  'Irrigation Recommendation Report',
  FERTILIZER:  'Fertilizer Recommendation Report',
  YIELD:       'Yield Prediction Report',
  PEST:        'Pest Risk Report',
  WEATHER:     'Weather Advisory Report',
}

// Same accent colors used across the web UI, kept consistent in the PDF
const TYPE_COLOR = {
  SUITABILITY: '#2ecc71',
  DISEASE:     '#e74c3c',
  IRRIGATION:  '#3498db',
  FERTILIZER:  '#f4c430',
  YIELD:       '#2ecc71',
  PEST:        '#e67e22',
  WEATHER:     '#3498db',
}

const BRAND_GREEN = [31, 111, 61]

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

/** Returns [label, value, isHighlight] rows — the highlight row gets a colored badge value. */
function parseSummary(type, result) {
  if (type === 'SUITABILITY') {
    return [
      ['Result',         result.suitable ? 'Suitable for Paddy' : 'Not Suitable', true],
      ['Confidence',     `${result.confidence}%`],
      ['Risk Level',     result.risk_level || '-'],
      ['Soil Type',      result.soil_type || '-'],
      ['Recommendation', result.recommendation || '-'],
    ]
  }
  if (type === 'DISEASE') {
    return [
      ['Detected Disease', result.disease_name || '-', true],
      ['Confidence',       `${result.confidence}%`],
      ['Severity',         result.severity || '-'],
      ['Treatment',        result.treatment || '-'],
      ['Prevention',       result.prevention || '-'],
    ]
  }
  if (type === 'IRRIGATION') {
    return [
      ['Irrigation Needed', result.irrigation_needed ? 'Yes' : 'No', true],
      ['Urgency',           result.urgency || '-'],
      ['Recommended Water', `${result.recommended_water_mm} mm`],
      ['Next Check',        `${result.next_check_days} day(s)`],
      ['Reason',            result.reason || '-'],
    ]
  }
  if (type === 'FERTILIZER') {
    return [
      ['Recommended Fertilizer', result.fertilizer_name || '-', true],
      ['Confidence',             `${result.confidence}%`],
      ['Quantity Required',      `${result.quantity_kg_per_acre} kg/acre`],
      ['Application Schedule',   result.application_schedule || '-'],
      ['Organic Alternative',    result.organic_alternative || '-'],
    ]
  }
  if (type === 'YIELD') {
    return [
      ['Estimated Yield',        `${result.estimated_yield_kg_acre} kg/acre`, true],
      ['Expected Harvest',       `${result.expected_harvest_days} days`],
      ['Production Efficiency',  `${result.production_efficiency_score}%`],
      ['Baseline Regional Yield',`${result.baseline_yield_kg_ha} kg/ha`],
      ['Notes',                  result.notes || '-'],
    ]
  }
  if (type === 'PEST') {
    return [
      ['Pest Risk Level',       result.risk_level || '-', true],
      ['Confidence',            `${result.risk_score}%`],
      ['Most Likely Pest',      result.likely_pest || '-'],
      ['Recommended Pesticide', result.recommended_pesticide || '-'],
      ['Organic Option',        result.organic_option || '-'],
    ]
  }
  if (type === 'WEATHER') {
    return [
      ['Planting Advice',    result.best_planting_advice || '-', true],
      ['Fertilizer Timing',  result.fertilizer_timing || '-'],
      ['Irrigation Timing',  result.irrigation_timing || '-'],
      ['Harvest Planning',   result.harvest_planning || '-'],
      ['Alerts',             (result.alerts || []).join('; ') || '-'],
    ]
  }
  return []
}

function guessImageFormat(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,/i)
  if (!m) return null
  const ext = m[1].toLowerCase()
  return ext === 'jpg' ? 'JPEG' : ext.toUpperCase()
}

/** Draws a colored pill/badge and returns its width in pt. */
function drawBadge(doc, text, x, y, colorHex) {
  const [r, g, b] = hexToRgb(colorHex)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  const w = doc.getTextWidth(text) + 20
  doc.setFillColor(r, g, b)
  doc.roundedRect(x, y - 13, w, 20, 5, 5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(text, x + 10, y + 1)
  return w
}

function drawHeader(doc, type, meta) {
  const [r, g, b] = hexToRgb(TYPE_COLOR[type] || '#2ecc71')
  // Brand band
  doc.setFillColor(...BRAND_GREEN)
  doc.rect(0, 0, 595, 64, 'F')
  // Accent strip under it, colored per prediction type
  doc.setFillColor(r, g, b)
  doc.rect(0, 64, 595, 4, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(19)
  doc.setFont(undefined, 'bold')
  doc.text('Paddy AI', 48, 30)
  doc.setFontSize(10.5)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(230, 245, 235)
  doc.text('AI-Powered Crop Management for Sri Lanka', 48, 44)

  doc.setFontSize(12.5)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(255, 255, 255)
  const title = TYPE_TITLE[type] || 'Prediction Report'
  doc.text(title, 595 - 48 - doc.getTextWidth(title), 34)

  let y = 96
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9.5)
  doc.setFont(undefined, 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 48, y)
  if (meta.farmerName) {
    const label = `Farmer: ${meta.farmerName}`
    doc.text(label, 595 - 48 - doc.getTextWidth(label), y)
  }
  return y + 18
}

function drawFooter(doc) {
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(230, 230, 230)
  doc.line(48, pageH - 46, 547, pageH - 46)
  doc.setFontSize(8.5)
  doc.setTextColor(150, 150, 150)
  doc.setFont(undefined, 'normal')
  doc.text('This report was generated automatically by the Paddy AI decision-support system.', 48, pageH - 32)
  doc.text('It is intended to support, not replace, professional agricultural advice.', 48, pageH - 21)
  const credit = '\u00A9 ' + new Date().getFullYear() + ' Paddy AI \u2014 Sri Lanka. All Rights Reserved.  |  Designed & Developed by Mohamed Fawaas'
  doc.text(credit, 595 - 48 - doc.getTextWidth(credit), pageH - 21)
}

/** Feature 5: Export a single prediction result as a modern, printable PDF report
 *  (with photo + AI focus-map images when available) that a farmer can hand to
 *  an agriculture officer or keep for their records.
 *
 *  `images` (optional): { photo: <dataURL of uploaded leaf photo>, heatmap: <dataURL Grad-CAM overlay> }
 *  Currently populated for DISEASE reports; safely ignored for other types. */
export function exportPredictionPdf(type, result, meta = {}, images = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const color = TYPE_COLOR[type] || '#2ecc71'

  let y = drawHeader(doc, type, meta)

  doc.setDrawColor(220, 220, 220)
  doc.line(marginX, y, 547, y)
  y += 26

  const rows = parseSummary(type, result)

  // Highlight row rendered as a colored badge under a small caption
  if (rows.length && rows[0][2]) {
    const [label, value] = rows[0]
    doc.setFontSize(9.5)
    doc.setTextColor(120, 120, 120)
    doc.setFont(undefined, 'normal')
    doc.text(label.toUpperCase(), marginX, y)
    y += 16
    drawBadge(doc, String(value), marginX, y, color)
    y += 30
    rows.shift()
  }

  doc.setFontSize(11.5)
  rows.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...BRAND_GREEN)
    doc.text(String(label), marginX, y)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(45, 45, 45)
    const lines = doc.splitTextToSize(String(value), 370)
    doc.text(lines, marginX + 160, y)
    y += Math.max(20, lines.length * 14)
    if (y > 700) { drawFooter(doc); doc.addPage(); y = 56 }
  })

  // ── Images: uploaded photo + AI focus map (Grad-CAM), side by side ──
  const photoFmt   = guessImageFormat(images.photo)
  const heatmapSrc = images.heatmap || result.heatmap_image
  const heatmapFmt = guessImageFormat(heatmapSrc)

  if (photoFmt || heatmapFmt) {
    y += 12
    if (y > 560) { drawFooter(doc); doc.addPage(); y = 56 }
    doc.setDrawColor(230, 230, 230)
    doc.line(marginX, y, 547, y)
    y += 22
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...BRAND_GREEN)
    doc.text('Visual Evidence', marginX, y)
    y += 14

    const imgW = 228, imgH = 170
    let x = marginX
    if (photoFmt) {
      try {
        doc.addImage(images.photo, photoFmt, x, y, imgW, imgH, undefined, 'FAST')
        doc.setDrawColor(200, 200, 200)
        doc.rect(x, y, imgW, imgH)
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text('Uploaded leaf photo', x, y + imgH + 14)
      } catch { /* ignore malformed image data */ }
      x += imgW + 20
    }
    if (heatmapFmt) {
      try {
        doc.addImage(heatmapSrc, heatmapFmt, x, y, imgW, imgH, undefined, 'FAST')
        doc.setDrawColor(200, 200, 200)
        doc.rect(x, y, imgW, imgH)
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text('AI focus map (Grad-CAM)', x, y + imgH + 14)
      } catch { /* ignore malformed image data */ }
    }
    y += imgH + 32
  }

  drawFooter(doc)

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`PaddyAI_${type}_${stamp}.pdf`)
}

/** Export the whole prediction history (all types) as one modern multi-row PDF table. */
export function exportHistoryPdf(records, meta = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 40
  let y = 96

  doc.setFillColor(...BRAND_GREEN)
  doc.rect(0, 0, 595, 64, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(19)
  doc.setFont(undefined, 'bold')
  doc.text('Paddy AI', marginX, 30)
  doc.setFontSize(10.5)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(230, 245, 235)
  doc.text('Prediction History Report', marginX, 44)

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9.5)
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y)
  if (meta.farmerName) doc.text(`Farmer: ${meta.farmerName}`, 320, y)
  y += 18
  doc.text(`Total records: ${records.length}`, marginX, y)
  y += 20

  // Table header row
  doc.setFillColor(245, 247, 245)
  doc.rect(marginX, y - 12, 515, 22, 'F')
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(90, 90, 90)
  doc.text('TYPE', marginX + 6, y + 3)
  doc.text('RESULT', marginX + 96, y + 3)
  doc.text('DATE', 460, y + 3)
  y += 20

  doc.setFontSize(9.5)
  records.forEach((rec, i) => {
    if (y > 770) { drawFooter(doc); doc.addPage(); y = 56 }
    let summary = '-'
    try {
      const o = JSON.parse(rec.result || '{}')
      if (rec.type === 'SUITABILITY') summary = o.suitable ? 'Suitable' : 'Not Suitable'
      else if (rec.type === 'DISEASE') summary = o.disease_name || '-'
      else if (rec.type === 'IRRIGATION') summary = o.irrigation_needed ? 'Irrigation Needed' : 'No Irrigation Needed'
      else if (rec.type === 'FERTILIZER') summary = o.fertilizer_name || '-'
      else if (rec.type === 'YIELD') summary = o.estimated_yield_kg_acre ? `${o.estimated_yield_kg_acre} kg/acre` : '-'
      else if (rec.type === 'PEST') summary = o.risk_level ? `${o.risk_level} Risk` : '-'
      else if (rec.type === 'WEATHER') summary = 'Weather Advisory'
    } catch { /* keep default summary */ }
    const date = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '-'

    if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(marginX, y - 11, 515, 18, 'F') }

    const [r, g, b] = hexToRgb(TYPE_COLOR[rec.type] || '#2ecc71')
    doc.setFillColor(r, g, b)
    doc.rect(marginX, y - 11, 3, 18, 'F')

    doc.setFont(undefined, 'bold')
    doc.setTextColor(r, g, b)
    doc.text(rec.type, marginX + 8, y + 2)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(45, 45, 45)
    doc.text(String(summary).slice(0, 45), marginX + 96, y + 2)
    doc.setTextColor(140, 140, 140)
    doc.text(date, 460, y + 2)
    y += 18
  })

  drawFooter(doc)

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`PaddyAI_History_${stamp}.pdf`)
}
