import Link from 'next/link'
import React from 'react'
import './styles.css'

export default async function HomePage() {
  return (
    <div className="home">
      <div className="content">
        <p>TZBlog CMS Bootstrap</p>
        <h1>Payload admin is ready to become the content control center.</h1>
        <div className="links">
          <Link
            className="admin"
            href="/admin"
          >
            Go to admin panel
          </Link>
          <a
            className="docs"
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            Payload docs
          </a>
        </div>
      </div>
      <div className="footer">
        <p>
          当前阶段只保留 CMS 占位前台。后续内容发布、globals、Webhook 和 Astro 数据链路会在下一轮接入。
        </p>
      </div>
    </div>
  )
}
