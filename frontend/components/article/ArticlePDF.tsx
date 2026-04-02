'use client'

import React from 'react'
import { Document, Page, Text, StyleSheet, BlobProvider } from '@react-pdf/renderer'
import type { Article } from '@video-transcriber/shared'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  meta: {
    fontSize: 10,
    color: '#666',
    marginBottom: 30,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
})

interface ArticlePDFProps {
  article: Article
}

function ArticlePDFDocument({ article }: ArticlePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.meta}>
          字数：{article.wordCount} | 生成时间：{new Date(article.createdAt).toLocaleString('zh-CN')}
        </Text>
        <Text style={styles.content}>{article.content}</Text>
      </Page>
    </Document>
  )
}

export function ArticlePDF({ article }: ArticlePDFProps) {
  return (
    <BlobProvider document={<ArticlePDFDocument article={article} />}>
      {({ loading, url }) =>
        loading ? (
          <span>生成中...</span>
        ) : url ? (
          <a href={url} download={`article_${Date.now()}.pdf`}>
            下载PDF
          </a>
        ) : null
      }
    </BlobProvider>
  )
}
