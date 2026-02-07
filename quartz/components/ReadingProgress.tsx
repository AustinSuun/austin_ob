import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/readingProgress.inline"

export default (() => {
  const ReadingProgress: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div id="reading-progress-container" class={displayClass ?? ""}>
        <div id="reading-progress-bar"></div>
      </div>
    )
  }

  ReadingProgress.css = `
    #reading-progress-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 9999;
      background: transparent;
      pointer-events: none;
    }

    #reading-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #448aff, #82b1ff);
      box-shadow: 0 0 10px rgba(68, 138, 255, 0.5);
      transition: width 0.1s ease-out;
    }
  `

  ReadingProgress.afterDOMLoaded = script
  return ReadingProgress
}) satisfies QuartzComponentConstructor
