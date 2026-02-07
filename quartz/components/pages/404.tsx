import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // 404 页面可能出现在任何深度，相对路径会失效，必须使用绝对路径
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint center-text">
      <h1 style="font-size: 4rem; margin-bottom: 1rem; color: var(--tertiary);">404</h1>
      <p style="font-size: 1.5rem; font-weight: bold;">糟糕，这里是知识荒原...</p>
      <p style="margin-bottom: 2rem; color: var(--gray);">你要找的笔记可能还在我的脑子里，或者在另一个平行宇宙。</p>
      
      <div style="display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap;">
        <a href={baseDir} class="external-link button-link home-link">🏠 返回首页</a>
        <a href="#" class="random-btn button-link" data-base-dir={baseDir}>🎲 随机传送</a>
      </div>

      <style>{`
        .center-text {
          text-align: center;
          padding: 4rem 1rem;
        }
        .button-link {
          display: inline-block;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          background-color: var(--lightgray);
          color: var(--dark);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .button-link:hover {
          background-color: var(--secondary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
      <script>{`
        // 针对本地环境修正首页链接
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          const homeLink = document.querySelector('.home-link');
          if (homeLink) {
            homeLink.href = '/';
          }
        }
      `}</script>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
