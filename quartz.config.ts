import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "人杰地灵东箭南金",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "zh-CN",
    baseUrl: "austinsuun.github.io/austin_ob",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter", 
        body: "Inter",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#fbfbf9",       // Warm paper white
          lightgray: "#e0e0e0",   // Subtle borders
          gray: "#b8b8b8",        // Metadata text
          darkgray: "#2c2c2c",    // Main body text - High Contrast
          dark: "#1a1a1a",        // Headings
          secondary: "#007CF0",   // Vercel Blue (Links, Graph Nodes)
          tertiary: "#7928CA",    // Vercel Purple (Hover, Graph)
          highlight: "rgba(0, 124, 240, 0.15)", // Blue highlight
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#1e1e2e",       // Apple Dark Grey style (not pitch black)
          lightgray: "#3a3a3c",   // Separators
          gray: "#8e8e93",        // Metadata
          darkgray: "#d1d1d6",    // Body text (readable grey-white)
          dark: "#f2f2f7",        // Headings (almost white)
          secondary: "#29a3ff",   // Brighter Blue for Dark Mode
          tertiary: "#a36bd4",    // Brighter Purple for Dark Mode
          highlight: "rgba(41, 163, 255, 0.15)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
     // Plugin.CustomOgImages(),
    ],
  },
}

export default config
