<template>
  <div
    ref="rootRef"
    class="hero-3d relative mx-auto w-full max-w-md select-none"
    aria-hidden="true"
  >
    <!-- Floating spheres -->
    <span v-for="n in 4" :key="n" class="hero-3d__sphere" :class="`hero-3d__sphere--${n}`" />

    <!-- Aa tile -->
    <div class="hero-3d__float hero-3d__aa hero-3d__enter hero-3d__enter--1">
      <span class="hero-3d__aa-text">Aa</span>
    </div>

    <!-- Lightbulb -->
    <div class="hero-3d__float hero-3d__bulb hero-3d__enter hero-3d__enter--2">
      <Lightbulb class="size-4 text-amber-500" />
    </div>

    <!-- Pencil -->
    <div class="hero-3d__float hero-3d__pencil hero-3d__enter hero-3d__enter--3">
      <div class="hero-3d__pencil-body" />
      <div class="hero-3d__pencil-tip" />
    </div>

    <!-- Check badge -->
    <div class="hero-3d__float hero-3d__check hero-3d__enter hero-3d__enter--4">
      <Check class="size-5 text-white" stroke-width="3" />
    </div>

    <!-- Main scene — mouse tilt wrapper preserves original CSS artwork -->
    <div
      ref="tiltRef"
      class="hero-3d__tilt hero-3d__enter--0"
    >
      <div class="hero-3d__scene">
        <!-- Platform -->
        <div class="hero-3d__platform">
          <div class="hero-3d__platform-ring hero-3d__platform-ring--3" />
          <div class="hero-3d__platform-ring hero-3d__platform-ring--2" />
          <div class="hero-3d__platform-ring hero-3d__platform-ring--1" />
          <div class="hero-3d__platform-top" />
        </div>

        <!-- Resume stack -->
        <div class="hero-3d__resume">
          <div class="hero-3d__resume-shadow" />
          <div class="hero-3d__resume-sheet hero-3d__resume-sheet--back" />
          <div class="hero-3d__resume-sheet hero-3d__resume-sheet--mid" />

          <div class="hero-3d__resume-front">
            <div class="hero-3d__chrome">
              <span /><span /><span />
            </div>

            <div class="hero-3d__body">
              <div class="hero-3d__sidebar">
                <div class="hero-3d__avatar">
                  <div class="hero-3d__avatar-head" />
                  <div class="hero-3d__avatar-shoulders" />
                </div>
                <div class="hero-3d__bar hero-3d__bar--primary hero-3d__draw" style="--i: 0" />
                <div class="hero-3d__bar hero-3d__draw" style="--i: 1" />
                <div class="hero-3d__bar hero-3d__bar--short hero-3d__draw" style="--i: 2" />
              </div>

              <div class="hero-3d__content">
                <div class="hero-3d__title-block">
                  <h3 class="hero-3d__title">{{ isZh ? '个人简历' : 'Resume' }}</h3>
                  <span class="hero-3d__subtitle">RESUME</span>
                </div>

                <div class="hero-3d__contact">
                  <div class="hero-3d__contact-row">
                    <span class="hero-3d__icon hero-3d__icon--phone" />
                    <div class="hero-3d__bar hero-3d__draw" style="--i: 3" />
                  </div>
                  <div class="hero-3d__contact-row">
                    <span class="hero-3d__icon hero-3d__icon--mail" />
                    <div class="hero-3d__bar hero-3d__draw" style="--i: 4" />
                  </div>
                  <div class="hero-3d__contact-row">
                    <span class="hero-3d__icon hero-3d__icon--pin" />
                    <div class="hero-3d__bar hero-3d__bar--short hero-3d__draw" style="--i: 5" />
                  </div>
                </div>

                <div class="hero-3d__section-bars">
                  <div class="hero-3d__bar hero-3d__bar--primary hero-3d__draw" style="--i: 6" />
                  <div class="hero-3d__bar hero-3d__draw" style="--i: 7" />
                  <div class="hero-3d__bar hero-3d__bar--primary hero-3d__bar--medium hero-3d__draw" style="--i: 8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Check, Lightbulb } from 'lucide-vue-next'

const props = defineProps<{
  isZh?: boolean
}>()

const isZh = computed(() => props.isZh ?? true)

const rootRef = ref<HTMLElement | null>(null)
const tiltRef = ref<HTMLElement | null>(null)

const MAX_TILT_X = 12
const MAX_TILT_Y = 16

let targetRotX = 0
let targetRotY = 0
let currentRotX = 0
let currentRotY = 0

let interactionTarget: HTMLElement | null = null
let pointerActive = false
let reducedMotion = false
let rafId = 0
let time = 0
let lastFrame = performance.now()

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function resolveInteractionTarget(container: HTMLElement): HTMLElement {
  return (
    container.closest('.hero-section') as HTMLElement | null ??
    container.closest('.hero-visual-wrap') as HTMLElement | null ??
    container
  )
}

function isInsideTarget(clientX: number, clientY: number): boolean {
  const el = interactionTarget ?? rootRef.value
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

function onPointerMove(e: PointerEvent) {
  const el = interactionTarget ?? rootRef.value
  if (!el) return

  const inside = isInsideTarget(e.clientX, e.clientY)
  if (!inside) {
    if (pointerActive) {
      pointerActive = false
      targetRotX = 0
      targetRotY = 0
    }
    return
  }

  const rect = el.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width - 0.5
  const py = (e.clientY - rect.top) / rect.height - 0.5
  targetRotY = px * MAX_TILT_Y * 2
  targetRotX = -py * MAX_TILT_X * 2
  pointerActive = true
}

function tick(now: number) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05)
  lastFrame = now

  if (!reducedMotion) {
    if (!pointerActive) {
      targetRotX = Math.sin(time * 0.55) * MAX_TILT_X * 0.1
      targetRotY = Math.cos(time * 0.45) * MAX_TILT_Y * 0.08
    }

    const lambda = pointerActive ? 10 : 4
    currentRotX = damp(currentRotX, targetRotX, lambda, dt)
    currentRotY = damp(currentRotY, targetRotY, lambda, dt)

    const tiltEl = tiltRef.value
    if (tiltEl) {
      tiltEl.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`
    }

    time += dt
  }

  rafId = requestAnimationFrame(tick)
}

function bindPointerEvents() {
  if (reducedMotion) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
}

function unbindPointerEvents() {
  window.removeEventListener('pointermove', onPointerMove)
}

async function initInteraction() {
  await nextTick()

  const container = rootRef.value
  if (!container) return

  unbindPointerEvents()
  cancelAnimationFrame(rafId)

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  interactionTarget = resolveInteractionTarget(container)

  currentRotX = 0
  currentRotY = 0
  targetRotX = 0
  targetRotY = 0
  pointerActive = false
  time = 0
  lastFrame = performance.now()

  if (tiltRef.value) {
    tiltRef.value.style.transform = ''
  }

  bindPointerEvents()
  if (!reducedMotion) {
    rafId = requestAnimationFrame(tick)
  }
}

onMounted(() => {
  initInteraction()
})

onUnmounted(() => {
  unbindPointerEvents()
  cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.hero-3d {
  --blue: hsl(var(--primary));
  --blue-light: hsl(var(--primary) / 0.75);
  --blue-soft: hsl(var(--primary) / 0.12);
  --blue-dark: color-mix(in srgb, hsl(var(--primary)) 75%, #1e3a8a);
  height: 420px;
  perspective: 900px;
  transform-style: preserve-3d;
}

.hero-3d__enter {
  opacity: 0;
  animation: heroEnter 0.75s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
.hero-3d__tilt.hero-3d__enter--0 {
  opacity: 0;
  animation: heroEnterTilt 0.75s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  animation-delay: 0.05s;
}

@keyframes heroEnterTilt {
  from { opacity: 0; }
  to { opacity: 1; }
}
.hero-3d__enter--1 { animation-delay: 0.2s; }
.hero-3d__enter--2 { animation-delay: 0.3s; }
.hero-3d__enter--3 { animation-delay: 0.35s; }
.hero-3d__enter--4 { animation-delay: 0.45s; }

@keyframes heroEnter {
  from { opacity: 0; transform: translateY(28px) scale(0.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Spheres */
.hero-3d__sphere {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--blue-light), var(--blue));
  box-shadow: 0 4px 12px hsl(var(--primary) / 0.35);
  animation: sphereFloat 4s ease-in-out infinite;
  z-index: 1;
}
.hero-3d__sphere--1 { width: 14px; height: 14px; top: 18%; right: 18%; animation-delay: 0s; }
.hero-3d__sphere--2 { width: 10px; height: 10px; top: 32%; right: 8%; animation-delay: 0.8s; opacity: 0.85; }
.hero-3d__sphere--3 { width: 8px; height: 8px; bottom: 38%; left: 12%; animation-delay: 1.2s; }
.hero-3d__sphere--4 { width: 12px; height: 12px; top: 12%; left: 28%; animation-delay: 0.4s; }

@keyframes sphereFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Float elements */
.hero-3d__float {
  position: absolute;
  z-index: 5;
  animation: floatItem 4.5s ease-in-out infinite;
}

.hero-3d__aa {
  top: 14%;
  left: 6%;
  width: 52px;
  height: 44px;
  background: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px hsl(var(--primary) / 0.2);
  transform: rotate(-8deg);
  animation-delay: 0.3s;
}

.hero-3d__aa-text {
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--blue), var(--blue-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-3d__bulb {
  top: 8%;
  right: 22%;
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
  animation-delay: 0.6s;
}

.hero-3d__pencil {
  bottom: 28%;
  left: 2%;
  width: 56px;
  height: 14px;
  transform: rotate(-35deg);
  animation-delay: 0.5s;
}

.hero-3d__pencil-body {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--blue) 0%, var(--blue-light) 70%, #fde68a 85%, #fbbf24 100%);
  border-radius: 4px;
  box-shadow: 0 4px 12px hsl(var(--primary) / 0.35);
}

.hero-3d__pencil-tip {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 10px solid #fbbf24;
}

.hero-3d__check {
  bottom: 32%;
  right: 4%;
  width: 44px;
  height: 44px;
  background: linear-gradient(145deg, var(--blue-light), var(--blue));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px hsl(var(--primary) / 0.4);
  animation-delay: 0.7s;
}

@keyframes floatItem {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero-3d__pencil {
  animation-name: floatPencil;
}
@keyframes floatPencil {
  0%, 100% { transform: rotate(-35deg) translateY(0); }
  50% { transform: rotate(-35deg) translateY(-8px); }
}

.hero-3d__aa {
  animation-name: floatAa;
}
@keyframes floatAa {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50% { transform: rotate(-8deg) translateY(-8px); }
}

/* Mouse-tilt wrapper */
.hero-3d__tilt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  will-change: transform;
}

/* Scene */
.hero-3d__scene {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  animation: sceneFloat 5s ease-in-out infinite;
}

@keyframes sceneFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Platform */
.hero-3d__platform {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%) rotateX(72deg);
  transform-style: preserve-3d;
}

.hero-3d__platform-ring,
.hero-3d__platform-top {
  position: absolute;
  left: 50%;
  border-radius: 50%;
  transform: translateX(-50%);
}

.hero-3d__platform-ring--3 {
  bottom: -8px;
  width: 280px;
  height: 72px;
  background: linear-gradient(180deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08));
  border: 1px solid hsl(var(--primary) / 0.2);
}

.hero-3d__platform-ring--2 {
  bottom: 4px;
  width: 240px;
  height: 60px;
  background: linear-gradient(180deg, #fff, hsl(var(--primary) / 0.1));
  border: 1px solid hsl(var(--primary) / 0.15);
  box-shadow: 0 8px 24px hsl(var(--primary) / 0.15);
}

.hero-3d__platform-ring--1 {
  bottom: 14px;
  width: 200px;
  height: 48px;
  background: linear-gradient(180deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.35));
}

.hero-3d__platform-top {
  bottom: 22px;
  width: 160px;
  height: 36px;
  background: linear-gradient(145deg, var(--blue-light), var(--blue));
  box-shadow: 0 4px 16px hsl(var(--primary) / 0.35);
}

/* Resume */
.hero-3d__resume {
  position: relative;
  width: 280px;
  transform: rotateY(-8deg) rotateX(4deg);
  transform-style: preserve-3d;
  margin-bottom: 48px;
}

.hero-3d__resume-shadow {
  position: absolute;
  bottom: -20px;
  left: 10%;
  width: 80%;
  height: 24px;
  background: radial-gradient(ellipse, hsl(var(--primary) / 0.25) 0%, transparent 70%);
  filter: blur(8px);
}

.hero-3d__resume-sheet {
  position: absolute;
  inset: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.hero-3d__resume-sheet--back {
  transform: translate(8px, 8px) translateZ(-16px);
  opacity: 0.5;
}
.hero-3d__resume-sheet--mid {
  transform: translate(4px, 4px) translateZ(-8px);
  opacity: 0.75;
}

.hero-3d__resume-front {
  position: relative;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 24px 48px hsl(var(--primary) / 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  border: 2px solid hsl(var(--primary) / 0.15);
}

.hero-3d__chrome {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: linear-gradient(90deg, var(--blue-dark), var(--blue));
}
.hero-3d__chrome span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
}

.hero-3d__body {
  display: flex;
  gap: 12px;
  padding: 14px;
}

.hero-3d__sidebar {
  width: 72px;
  flex-shrink: 0;
}

.hero-3d__avatar {
  width: 56px;
  height: 56px;
  margin: 0 auto 10px;
  border-radius: 12px;
  background: linear-gradient(180deg, var(--blue-soft), #fff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 4px;
  overflow: hidden;
}

.hero-3d__avatar-head {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fcd9b6, #e8b896);
  margin-bottom: 2px;
}

.hero-3d__avatar-shoulders {
  width: 36px;
  height: 18px;
  border-radius: 18px 18px 0 0;
  background: linear-gradient(180deg, var(--blue), var(--blue-dark));
}

.hero-3d__content {
  flex: 1;
  min-width: 0;
}

.hero-3d__title-block {
  margin-bottom: 10px;
}

.hero-3d__title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.hero-3d__subtitle {
  font-size: 10px;
  font-weight: 600;
  color: var(--blue);
  letter-spacing: 0.1em;
  line-height: 1.3;
}

.hero-3d__contact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.hero-3d__contact-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-3d__icon {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
  background: var(--blue-soft);
  position: relative;
}
.hero-3d__icon--phone::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 1.5px solid var(--blue);
  border-radius: 2px;
}
.hero-3d__icon--mail::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 2px;
  right: 2px;
  height: 6px;
  border: 1.5px solid var(--blue);
  border-radius: 1px;
}
.hero-3d__icon--pin {
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--blue);
  width: 10px;
  height: 10px;
}

.hero-3d__section-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-3d__bar {
  height: 5px;
  border-radius: 3px;
  background: #e2e8f0;
  transform-origin: left;
  animation: drawBar 0.5s ease forwards;
  animation-delay: calc(0.4s + var(--i) * 0.08s);
  transform: scaleX(0);
}
.hero-3d__bar--primary {
  background: linear-gradient(90deg, var(--blue), var(--blue-light));
}
.hero-3d__bar--short { width: 70%; }
.hero-3d__bar--medium { width: 55%; }

@keyframes drawBar {
  to { transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-3d__enter,
  .hero-3d__scene,
  .hero-3d__float,
  .hero-3d__sphere,
  .hero-3d__bar {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
  .hero-3d__tilt,
  .hero-3d__enter--0 {
    animation: none !important;
    opacity: 1;
  }
  .hero-3d__bar { transform: scaleX(1); }
  .hero-3d__pencil { transform: rotate(-35deg); }
  .hero-3d__aa { transform: rotate(-8deg); }
}
</style>
