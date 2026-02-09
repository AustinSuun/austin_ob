
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/mathFix.inline"

export default (() => {
  const MathFix: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return <></>
  }

  MathFix.afterDOMLoaded = script
  return MathFix
}) satisfies QuartzComponentConstructor
