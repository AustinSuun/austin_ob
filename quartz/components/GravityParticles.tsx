import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/gravityParticles.inline"

export default (() => {
  // This component is a placeholder - the actual canvas is created dynamically by the script
  // We keep this component to ensure the script is included in the build
  const GravityParticles: QuartzComponent = (_props: QuartzComponentProps) => {
    return null
  }

  GravityParticles.afterDOMLoaded = script
  return GravityParticles
}) satisfies QuartzComponentConstructor
