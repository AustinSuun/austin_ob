import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    // Split title into text and emoji parts
    // Using a capture group ensures the delimiter (emoji) is included in the result array
    // This regex matches Emoji Presentation and Extended Pictographics
    const parts = title.split(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu)
    
    return (
      <h1 class={classNames(displayClass, "article-title")}>
        {parts.map((part, index) => {
           // If part is an emoji (simple check: matches regex), wrap in natural span
           // Otherwise wrap in gradient-text
           if (part.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu)) {
               return <span key={index} class="emoji-text">{part}</span>
           } else if (part.trim().length > 0) { // Only wrap non-empty text
               return <span key={index} class="gradient-text">{part}</span>
           }
           return part // Spaces/empty strings
        })}
      </h1>
    )
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
