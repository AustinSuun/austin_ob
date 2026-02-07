import { FullSlug, isFolderPath, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"

export type SortFn = (f1: QuartzPluginData, f2: QuartzPluginData) => number

export function byDateAndAlphabetical(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

export function byDateAndAlphabeticalFolderFirst(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort folders first
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1

    // If both are folders or both are files, sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

// Re-export options type so it can be used by the constructor
export type Options = {
  sort?: SortFn
  limit?: number
}

// Change to named export to fix import errors
export const PageList: QuartzComponentConstructor<Partial<Options>> = ((opts?: Partial<Options>) => {
  const PageList: QuartzComponent = (props: QuartzComponentProps) => {
    // Merge props with options (options take precedence if passed at creation time)
    // Note: PageList doesn't seem to use props for config, but relies on what's passed here or calculated
    const { cfg, fileData, allFiles } = props

    // Use options passed during component creation
    const limit = opts?.limit
    const sort = opts?.sort
    
    // Filter out index pages or non-content pages if necessary (optional improvement)
    // For now, keep original logic but apply sort/limit
    
    const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
    let list = allFiles.sort(sorter)
    if (limit) {
      list = list.slice(0, limit)
    }

    return (
      <ul class="section-ul">
        {list.map((page) => {
          const title = page.frontmatter?.title
          const tags = page.frontmatter?.tags ?? []
          const slug = page.slug!

          return (
            <li class="section-li">
              <div class="section">
                <p class="meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </p>
                <div class="desc">
                  <h3>
                    <a href={resolveRelative(fileData.slug!, slug)} class="internal">
                      {title}
                    </a>
                  </h3>
                </div>
                <ul class="tags">
                  {tags.map((tag) => (
                    <li>
                      <a
                        class="internal tag-link"
                        href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                      >
                        {tag}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  PageList.css = `
  .section h3 {
    margin: 0;
  }
  
  .section > .tags {
    margin: 0;
  }
  `
  return PageList
}) satisfies QuartzComponentConstructor

export default PageList


