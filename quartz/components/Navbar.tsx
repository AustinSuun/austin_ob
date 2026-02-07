import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// @ts-ignore
import script from "./scripts/randomPage.inline"

export default (() => {
  const Navbar: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const baseDir = pathToRoot(fileData.slug!)
    return (
      <div class={`navbar-links ${displayClass ?? ""}`}>
        <a href={baseDir} class="nav-btn">🏠 Home</a>
        <a href={`${baseDir}/Timeline`} class="nav-btn">⏳ Timeline</a>
        <a href={`${baseDir}/tags`} class="nav-btn">🏷️ Tags</a>
        <a href="#" class="nav-btn random-btn" data-base-dir={baseDir}>🎲 漫步</a>
      </div>
    )
  }
 
  Navbar.css = `
  .navbar-links {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .nav-btn {
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    color: var(--darkgray);
    transition: color 0.2s ease;
    padding: 0.2rem 0;
  }
  .nav-btn:hover {
    color: var(--secondary);
    border-bottom: 2px solid var(--secondary);
  }

  `
  Navbar.afterDOMLoaded = script
  return Navbar
}) satisfies QuartzComponentConstructor
