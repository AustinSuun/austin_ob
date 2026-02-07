import { Date as DateComponent, getDate } from "./Date"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

interface ContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
}

const defaultOptions: ContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
}

export default ((opts?: Partial<ContentMetaOptions>) => {
  // Merge options with defaults
  const options: ContentMetaOptions = { ...defaultOptions, ...opts }

  function ContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        segments.push(<DateComponent date={getDate(cfg, fileData)!} locale={cfg.locale} />)
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      segments.push(
        <span id="busuanzi_container_page_pv" style="display:none">
          🔥 阅读量 <span id="busuanzi_value_page_pv"></span>
        </span>,
      )

      // Check for content freshness
      if (fileData.dates?.modified) {
        const modifiedDate = fileData.dates.modified
        const daysSinceUpdate = Math.floor(
          (Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24),
        )
        
        if (daysSinceUpdate > 180) {
          segments.push(
            <span class="content-freshness-warning" title={`最后更新于 ${daysSinceUpdate} 天前`}>
              ⚠️ 内容可能已过时
            </span>,
          )
        }
      }

      return (
        <p show-comma={options.showComma} class={classNames(displayClass, "content-meta")}>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  ContentMetadata.css = style

  return ContentMetadata
}) satisfies QuartzComponentConstructor
