export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getFileExtension(type: 'transcript_txt' | 'transcript_word' | 'article_pdf'): string {
  switch (type) {
    case 'transcript_txt':
      return 'txt'
    case 'transcript_word':
      return 'docx'
    case 'article_pdf':
      return 'pdf'
    default:
      return 'bin'
  }
}
