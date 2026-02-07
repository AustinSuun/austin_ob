import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/backToTop.inline"

export default (() => {
  const BackToTop: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <button id="back-to-top" class={displayClass ?? ""} aria-label="回到顶部">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>
    )
  }

  BackToTop.css = `
    #back-to-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--secondary);
      color: var(--light);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
    }

    #back-to-top.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    #back-to-top:hover {
      background: var(--tertiary);
      transform: translateY(-4px);
      box-shadow: 0 6px 20px rgba(68, 138, 255, 0.4);
    }

    #back-to-top:active {
      transform: translateY(-2px);
    }

    @media (max-width: 600px) {
      #back-to-top {
        bottom: 1rem;
        right: 1rem;
        width: 45px;
        height: 45px;
      }
    }
  `

  BackToTop.afterDOMLoaded = script
  return BackToTop
}) satisfies QuartzComponentConstructor
