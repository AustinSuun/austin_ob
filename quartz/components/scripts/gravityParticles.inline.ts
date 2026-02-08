// Magnetic Particles - Hidden Until Attracted
document.addEventListener("nav", () => {
  const slug = document.body.dataset.slug
  if (slug !== "index" && slug !== "") {
    const existingCanvas = document.getElementById("gravity-particles-dynamic")
    if (existingCanvas) existingCanvas.remove()
    return
  }

  const existingCanvas = document.getElementById("gravity-particles-dynamic")
  if (existingCanvas) existingCanvas.remove()

  const canvas = document.createElement("canvas")
  canvas.id = "gravity-particles-dynamic"
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    pointer-events: none;
  `
  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  let width = 0
  let height = 0
  let particles: Particle[] = []
  let mouseX: number | null = null
  let mouseY: number | null = null
  let animationId: number | null = null
  let hoveredElement: Element | null = null
  let targetPoints: { x: number; y: number }[] = []

  const config = {
    // Grid-based distribution for even spacing
    gridSpacingX: 56,   // Increased to reduce density by ~50%
    gridSpacingY: 56,   // Increased to reduce density by ~50%
    colors: [
      "41, 163, 255",
      "123, 97, 255",
      "255, 159, 10",
      "255, 95, 95",
      "0, 212, 255"
    ],
    ellipseWidth: 0.6,
    ellipseHeight: 12,
    // Attraction settings
    attractionRadius: 670,   // Visibility range (+2/3)
    sphereRadius: 930,      // 3D ellipsoid effect radius (+2/3)
    maxOpacity: 0.7,
    // Button attraction - only when mouse is actually over button
    buttonAttractionRadius: 60
  }

  function getElementOutlinePoints(el: Element): { x: number; y: number }[] {
    const rect = el.getBoundingClientRect()
    const points: { x: number; y: number }[] = []
    const padding = 25  // Distance from button edge (creates a halo effect)
    const spacing = 8   // Denser points for smoother outline

    // Top edge
    for (let x = rect.left - padding; x <= rect.right + padding; x += spacing) {
      points.push({ x, y: rect.top - padding })
    }
    // Right edge
    for (let y = rect.top - padding; y <= rect.bottom + padding; y += spacing) {
      points.push({ x: rect.right + padding, y })
    }
    // Bottom edge
    for (let x = rect.right + padding; x >= rect.left - padding; x -= spacing) {
      points.push({ x, y: rect.bottom + padding })
    }
    // Left edge
    for (let y = rect.bottom + padding; y >= rect.top - padding; y -= spacing) {
      points.push({ x: rect.left - padding, y })
    }
    return points
  }

  function findNearbyInteractiveElement(mx: number, my: number): Element | null {
    const selectors = 'a, button, [role="button"], .clickable, #timeline-btn'
    const elements = document.querySelectorAll(selectors)
    
    for (const el of elements) {
      const rect = el.getBoundingClientRect()
      // Only trigger when mouse is actually inside or very close to the element
      const padding = config.buttonAttractionRadius
      if (mx >= rect.left - padding && mx <= rect.right + padding &&
          my >= rect.top - padding && my <= rect.bottom + padding) {
        return el
      }
    }
    return null
  }

  class Particle {
    homeX: number
    homeY: number
    x: number
    y: number
    displayAngle: number = 0
    currentOpacity: number = 0
    baseOpacity: number
    color: string
    targetIndex: number = -1
    // For natural floating motion
    floatPhaseX: number
    floatPhaseY: number
    floatSpeedX: number
    floatSpeedY: number
    floatAmplitude: number
    // Pulse effect
    pulsePhase: number
    pulseSpeed: number
    pulseStrength: number

    constructor(homeX: number, homeY: number) {
      this.homeX = homeX
      this.homeY = homeY
      // Slight random offset for organic feel
      this.homeX += (Math.random() - 0.5) * config.gridSpacingX * 0.5
      this.homeY += (Math.random() - 0.5) * config.gridSpacingY * 0.5
      this.x = this.homeX
      this.y = this.homeY
      this.displayAngle = Math.random() * Math.PI
      this.baseOpacity = Math.random() * 0.3 + 0.5
      this.color = config.colors[Math.floor(Math.random() * config.colors.length)]
      // Random phase and speed for floating
      this.floatPhaseX = Math.random() * Math.PI * 2
      this.floatPhaseY = Math.random() * Math.PI * 2
      this.floatSpeedX = 0.005 + Math.random() * 0.01
      this.floatSpeedY = 0.003 + Math.random() * 0.007 // Slower for more organic feel
      this.floatAmplitude = 15 + Math.random() * 20 
      // Pulse initialization
      this.pulsePhase = Math.random() * Math.PI * 2
      this.pulseSpeed = 0.01 + Math.random() * 0.02
      this.pulseStrength = 0.15 + Math.random() * 0.2
    }

    update(mx: number | null, my: number | null, targets: { x: number; y: number }[], time: number) {
      // Natural floating motion
      this.floatPhaseX += this.floatSpeedX
      this.floatPhaseY += this.floatSpeedY
      const floatOffsetX = Math.sin(this.floatPhaseX) * this.floatAmplitude
      const floatOffsetY = Math.sin(this.floatPhaseY) * this.floatAmplitude

      let targetX = this.homeX + floatOffsetX
      let targetY = this.homeY + floatOffsetY
      let targetAngle = Math.sin(time * 0.0008 + this.floatPhaseX) * 0.3  // Gentle sway
      
      // Breathing pulse calculation
      this.pulsePhase += this.pulseSpeed
      const breathing = Math.sin(this.pulsePhase) * this.pulseStrength
      
      let targetOpacity = 0  // Hidden by default

      if (mx !== null && my !== null) {
        const dx = mx - this.homeX
        const dy = my - this.homeY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < config.attractionRadius) {
          const normalizedDist = dist / config.attractionRadius
          
          // Tidal Wave Logic:
          // Use time and distance from mouse to create a coordinated "ripple"
          const waveSpeed = 0.003
          const waveFreq = 0.015
          const wavePhase = (time * waveSpeed) - (dist * waveFreq)
          const ripple = Math.sin(wavePhase + this.floatPhaseX * 0.5) 
          
          // Modulate opacity with wave: the wave "crest" is more visible
          // Combine breathing with the ripple for more organic look
          const waveOpacity = (0.5 + ripple * 0.5) * 0.4 + 0.6 // Waves between 0.6 and 1.0 intensity
          targetOpacity = (this.baseOpacity + breathing) * waveOpacity * Math.pow(1 - normalizedDist, 0.5)

          // Radial Tidal Motion:
          // Slightly push/pull particles along the radial vector based on wave crest
          const tideOffset = ripple * 12 * (1 - normalizedDist)
          const radialAngle = Math.atan2(dy, dx)
          targetX = this.homeX + Math.cos(radialAngle) * tideOffset
          targetY = this.homeY + Math.sin(radialAngle) * tideOffset

          // Rotate to point towards mouse
          targetAngle = Math.atan2(dy, dx) + Math.PI / 2

          // Add slight mouse attraction pull on top of tidal motion
          const pullStrength = (1 - normalizedDist) * 0.15
          targetX += dx * pullStrength
          targetY += dy * pullStrength
        }

        // Button attraction override
        if (targets.length > 0) {
          // Find nearest target point
          if (this.targetIndex === -1) {
            let minDist = Infinity
            for (let i = 0; i < targets.length; i++) {
              const td = Math.sqrt((this.homeX - targets[i].x) ** 2 + (this.homeY - targets[i].y) ** 2)
              if (td < minDist) {
                minDist = td
                this.targetIndex = i
              }
            }
          }

          const target = targets[this.targetIndex]
          if (target) {
            const distToTarget = Math.sqrt((this.homeX - target.x) ** 2 + (this.homeY - target.y) ** 2)
            
            if (distToTarget < config.attractionRadius) {
              // Strong attraction to button outline
              const strength = Math.pow(1 - distToTarget / config.attractionRadius, 0.7)
              targetX = this.homeX + (target.x - this.homeX) * strength * 0.8
              targetY = this.homeY + (target.y - this.homeY) * strength * 0.8
              targetOpacity = this.baseOpacity * config.maxOpacity * strength

              // Align with outline
              const nextTarget = targets[(this.targetIndex + 1) % targets.length]
              targetAngle = Math.atan2(nextTarget.y - target.y, nextTarget.x - target.x) + Math.PI / 2
            }
          }
        } else {
          this.targetIndex = -1
        }
      }

      // Smooth transitions
      this.x += (targetX - this.x) * 0.12
      this.y += (targetY - this.y) * 0.12
      this.currentOpacity += (targetOpacity - this.currentOpacity) * 0.1

      // Smooth angle
      let angleDiff = targetAngle - this.displayAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      this.displayAngle += angleDiff * 0.25  // Faster angle changes
    }

    draw(context: CanvasRenderingContext2D, mx: number | null, my: number | null) {
      if (this.currentOpacity < 0.02) return

      context.save()
      context.translate(this.x, this.y)

      // 3D Ellipsoid Top effect: particles on the TOP of an ellipsoid centered at mouse
      let ellipsoidScale = 1  // How elongated (1 = full ellipse, 0 = dot)
      let tangentAngle = this.displayAngle

      if (mx !== null && my !== null) {
        const dx = this.x - mx
        const dy = this.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < config.sphereRadius) {
          const normalizedDist = dist / config.sphereRadius
          // Higher exponent = more gradual curve at edge, steeper near center = more dots
          ellipsoidScale = Math.pow(normalizedDist, 1.0)
          tangentAngle = Math.atan2(dy, dx) + Math.PI / 2
        }
      }

      context.rotate(tangentAngle)

      // Draw ellipse with ellipsoid-based scaling
      const finalWidth = config.ellipseWidth + (1 - ellipsoidScale) * 1.5
      const finalHeight = config.ellipseHeight * ellipsoidScale + config.ellipseWidth * (1 - ellipsoidScale)

      context.fillStyle = `rgba(${this.color}, ${this.currentOpacity})`
      context.beginPath()
      context.ellipse(0, 0, finalWidth, finalHeight, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }
  }

  function resize() {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    initParticles()
  }

  function initParticles() {
    particles = []
    // Create grid of particles
    for (let x = config.gridSpacingX / 2; x < width; x += config.gridSpacingX) {
      for (let y = config.gridSpacingY / 2; y < height; y += config.gridSpacingY) {
        particles.push(new Particle(x, y))
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height)

    // Find nearby interactive element
    if (mouseX !== null && mouseY !== null) {
      const newHovered = findNearbyInteractiveElement(mouseX, mouseY)
      if (newHovered !== hoveredElement) {
        hoveredElement = newHovered
        targetPoints = hoveredElement ? getElementOutlinePoints(hoveredElement) : []
        for (const p of particles) p.targetIndex = -1
      }
    } else {
      hoveredElement = null
      targetPoints = []
    }

    const time = performance.now()
    for (const particle of particles) {
      particle.update(mouseX, mouseY, targetPoints, time)
      particle.draw(ctx, mouseX, mouseY)
    }

    animationId = requestAnimationFrame(animate)
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX
    mouseY = e.clientY
  }

  function handleMouseOut() {
    mouseX = null
    mouseY = null
    hoveredElement = null
    targetPoints = []
  }

  resize()
  animate()

  window.addEventListener("resize", resize)
  window.addEventListener("mousemove", handleMouseMove)
  window.addEventListener("mouseout", handleMouseOut)

  window.addCleanup(() => {
    if (animationId) cancelAnimationFrame(animationId)
    window.removeEventListener("resize", resize)
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseout", handleMouseOut)
    canvas.remove()
  })
})
