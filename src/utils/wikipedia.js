export async function fetchWikipedia(name) {
  const encoded = encodeURIComponent(name)
  for (const lang of ['tr', 'en']) {
    try {
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (!data.extract || data.type === 'disambiguation') continue

      const extract = data.extract.length > 320
        ? data.extract.slice(0, 320) + '…'
        : data.extract

      const imgHtml = data.thumbnail?.source
        ? `<img src="${data.thumbnail.source}" alt="${name}"
             style="width:100%;border-radius:5px;margin-bottom:7px;display:block;max-height:140px;object-fit:cover">`
        : ''

      const pageUrl  = data.content_urls?.desktop?.page ?? ''
      const langNote = lang === 'en' ? ' (EN)' : ''

      return `
        ${imgHtml}
        <div style="font-size:11px;line-height:1.55;color:#bbb;margin-bottom:${pageUrl ? 6 : 0}px">${extract}</div>
        ${pageUrl
          ? `<a href="${pageUrl}" target="_blank" rel="noopener"
               style="font-size:11px;color:#4d8ef5;text-decoration:none">Wikipedia'da oku${langNote} →</a>`
          : ''}
      `
    } catch {
      continue
    }
  }
  return null
}
