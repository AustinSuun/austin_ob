import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { isFolderPath } from "./quartz/util/path"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.Navbar(), Component.ReadingProgress()],
  afterBody: [
    Component.ConditionalRender({
      component: Component.PageList({
        sort: (f1: any, f2: any) => {
          if (f1.dates && f2.dates) {
            return f2.dates.created.getTime() - f1.dates.created.getTime()
          } else if (f1.dates && !f2.dates) {
            return -1
          } else if (!f1.dates && f2.dates) {
            return 1
          }
          const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
          const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
          return f1Title.localeCompare(f2Title)
        },
        limit: 50
      }),
      condition: (page) => page.fileData.slug === "Timeline",
    }),
    Component.ConditionalRender({
      component: Component.Comments({
        provider: 'giscus',
        options: {
          repo: "AustinSuun/austin_ob",
          repoId: "R_kgDOOfhChw",
          category: "Announcements",
          categoryId: "DIC_kwDOOfhCh84C1_5r",
        }
      }),
      condition: (page) => !isFolderPath(page.fileData.slug!) && page.fileData.slug !== "index",
    }),
    Component.BackToTop(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/AustinSuun/austin_ob",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      folderClickBehavior: "collapse",
      filterFn: (node) => node.slugSegment !== "games",
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
    // Add Recent Notes to sidebar to make the page feel alive
    Component.DesktopOnly(Component.RecentNotes({ title: "最近更新", limit: 3 })),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      folderClickBehavior: "collapse",
      filterFn: (node) => node.slugSegment !== "games",
    }),
  ],
  right: [],
}
