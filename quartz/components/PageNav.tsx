import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/page-nav.inline"

export default (() => {
  const PageNav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return null
  }

  PageNav.afterDOMLoaded = script
  return PageNav
}) satisfies QuartzComponentConstructor
