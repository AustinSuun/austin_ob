import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    const segments = title.split(/(\p{Emoji_Presentation})/gu)
    return (
      <h1 class={classNames(displayClass, "article-title")}>
        {segments.map((segment, i) => (
          /\p{Emoji_Presentation}/u.test(segment) 
            ? <span key={i} class="emoji-text">{segment}</span>
            : <span key={i} class="gradient-text">{segment}</span>
        ))}
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
