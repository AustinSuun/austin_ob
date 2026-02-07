
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

export default (() => {
  const EmojiRestorer: QuartzComponent = () => {
    return null
  }
  
  EmojiRestorer.afterDOMLoaded = `
    const fixEmojis = () => {
      const selector = '#quartz-body .center h1, #quartz-body .center h2, #quartz-body .center h3, h1.article-title, .page-title';
      const headers = document.querySelectorAll(selector);
      
      // Use String.raw to safely construct the regex with explicit backslashes for the RegExp constructor
      // This ensures we get \\p (literal backslash + p) passed to RegExp, which interprets it as Unicode property
      const regex = new RegExp(String.raw\`\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\`, "gu");
      
      headers.forEach(h => {
        if (h.dataset.emojiRestored) return;
        
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let node;
        while(node = walker.nextNode()) nodes.push(node);
        
        let hasEmoji = false;
        nodes.forEach(textNode => {
          if (textNode.textContent.match(regex)) {
             hasEmoji = true;
             const wrapper = document.createElement('span');
             // Wrap the emoji in a span with the restore class
             wrapper.innerHTML = textNode.textContent.replace(regex, '<span class="emoji-restore">$1</span>');
             textNode.parentNode.replaceChild(wrapper, textNode);
          }
        });

        if (hasEmoji) h.dataset.emojiRestored = "true";
      });
    }

    const observer = new MutationObserver((mutations) => {
      let shouldRun = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
           shouldRun = true;
           break;
        }
      }
      if (shouldRun) fixEmojis();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial run
    fixEmojis();
    
    document.addEventListener('nav', () => { setTimeout(fixEmojis, 50); });
  `
  
  EmojiRestorer.css = `
  .emoji-restore {
     font-style: normal;
     background: none !important;
     background-clip: border-box !important; /* Critical: Stops parent background-clip: text from affecting this */
     -webkit-background-clip: border-box !important;
     -webkit-text-fill-color: initial !important; /* Critical: Restores default text color (black/white) */
     text-fill-color: initial !important;
     color: initial !important;
     text-shadow: none !important; /* No glow */
     filter: none !important;
     display: inline-block;
     isolation: isolate; /* Create new stacking context */
  }
  `

  return EmojiRestorer
}) satisfies QuartzComponentConstructor
