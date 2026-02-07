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
    <div class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="title-link">
        <img src={`${baseDir}/static/avatar.jpg`} alt="Logo" class="logo-image" />
        <h2 class="title-text">
        {segments.map((segment, i) => (
          /\p{Emoji_Presentation}/u.test(segment) 
            ? <span key={i} class="emoji-text">{segment}</span>
            : <span key={i} class="gradient-text">{segment}</span>
        ))}
        </h2>
      </a>
    </div>
  )
}

PageTitle.css = `
.page-title {
  margin: 1rem 0;
}
.title-link {
  display: flex;
  flex-direction: column; /* Vertical layout */
  align-items: center;    /* Center everything */
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}
.logo-image {
  width: 120px;           /* Much larger image */
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--lightgray); /* Thicker border */
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); /* Subtle shadow */
  transition: transform 0.3s ease;
}
.logo-image:hover {
  transform: scale(1.05); /* Interactive hover effect */
}
.title-text {
  font-size: 1.2rem;      /* Smaller text */
  margin: 0;
  font-weight: 600;
  text-align: center;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
