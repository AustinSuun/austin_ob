import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  
  // Split title by Emojis to apply gradients only to text
  const segments = title.split(/(\p{Emoji_Presentation})/gu)
  
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="title-link">
        <img src={`${baseDir}/static/avatar.jpg`} alt="Logo" class="logo-image" />
        {segments.map((segment, i) => (
          // If segment matches emoji regex (simple check), render as is. Else wrap in gradient-text
          /\p{Emoji_Presentation}/u.test(segment) 
            ? <span key={i} class="emoji-text">{segment}</span>
            : <span key={i} class="gradient-text">{segment}</span>
        ))}
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
}
.title-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}
.logo-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--lightgray);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
