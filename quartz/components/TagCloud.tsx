import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import { FullSlug, resolveRelative } from "../util/path"

const TagCloud: QuartzComponent = ({ fileData, allFiles, displayClass, cfg }: QuartzComponentProps) => {
  const tags = new Map<string, number>()
  
  // Collect all tags and count frequencies
  for (const file of allFiles) {
    const fileTags = file.frontmatter?.tags ?? []
    for (const tag of fileTags) {
      // Add the tag itself
      tags.set(tag, (tags.get(tag) ?? 0) + 1)
      
      // Also add parent tags if using nested tags (e.g. "game/rpg" -> "game")
      // const segments = getAllSegmentPrefixes(tag)
      // for (const segment of segments) {
      //   tags.set(segment, (tags.get(segment) ?? 0) + 1)
      // }
    }
  }

  const allTagsRaw = Array.from(tags.entries())
  const topTags = allTagsRaw.sort((a, b) => b[1] - a[1]).slice(0, 50)
  const allTags = topTags.sort((a, b) => a[0].localeCompare(b[0]))

  if (allTags.length === 0) {
    return null
  }

  // Calculate sizes for cloud effect
  const maxCount = Math.max(...allTags.map(([, count]) => count))
  const minCount = Math.min(...allTags.map(([, count]) => count))
  const range = maxCount - minCount + 1

  const getFontSize = (count: number) => {
    const weight = (count - minCount) / range
    // Font size between 0.8rem and 1.5rem
    return `${0.8 + weight * 0.7}rem` 
  }
  
  const getOpacity = (count: number) => {
      const weight = (count - minCount) / range
      return 0.6 + weight * 0.4
  }

  return (
    <div class={classNames(displayClass, "tag-cloud")}>
      <h3>{i18n(cfg.locale).pages.tagContent.tagIndex}</h3>
      <div class="tags-container">
        {allTags.map(([tag, count]) => {
          const linkDest = resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)
          return (
            <a 
              href={linkDest} 
              class="internal tag-cloud-item"
              style={{ 
                fontSize: getFontSize(count),
                opacity: getOpacity(count) 
              }}
              title={`${tag} (${count})`}
            >
              #{tag}
            </a>
          )
        })}
      </div>
    </div>
  )
}

TagCloud.css = `
.tag-cloud {
  margin-top: 2rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-cloud-item {
  display: inline-block;
  text-decoration: none;
  color: var(--secondary);
  transition: all 0.2s ease;
  line-height: 1.2;
}

.tag-cloud-item:hover {
  color: var(--tertiary);
  transform: scale(1.1);
  opacity: 1 !important;
}
`

export default (() => TagCloud) satisfies QuartzComponentConstructor
