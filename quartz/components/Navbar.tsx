import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const Navbar: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={`navbar-links ${displayClass ?? ""}`}>
        <a href="/" class="nav-btn">🏠 Home</a>
        <a href="/01-AI-System" class="nav-btn">🤖 AI & System</a>
        <a href="/04-Academic-Research/Paper-Reading" class="nav-btn">📄 Papers</a>
        <a href="/tags" class="nav-btn">🏷️ Tags</a>
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
  return Navbar
}) satisfies QuartzComponentConstructor
