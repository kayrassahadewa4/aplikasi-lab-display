<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Activity,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  TrendingUp,
  CheckCircle2,
  BarChart3
} from 'lucide-vue-next'
import type { LaboratoryStatisticDto } from '@/services/dashboard.service'

// Props
interface Props {
  laboratoryStatistics?: LaboratoryStatisticDto[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  laboratoryStatistics: () => [],
  isLoading: false,
})

// Scope Filter State
const scopeFilter = ref<'all' | 'high_occupancy'>('all')
const isScopeMenuOpen = ref(false)

// Hovered bar state for interactive chart tooltip
const hoveredLabId = ref<string | null>(null)

// Compute aggregate metrics
const activeLabs = computed(() => {
  return props.laboratoryStatistics.filter(lab => lab.total_schedules > 0 || lab.total_usage > 0).length
})

const totalLabs = computed(() => props.laboratoryStatistics.length)

const totalSchedules = computed(() => {
  return props.laboratoryStatistics.reduce((sum, lab) => sum + lab.total_schedules, 0)
})

const totalUsages = computed(() => {
  return props.laboratoryStatistics.reduce((sum, lab) => sum + lab.total_usage, 0)
})

// Calculate average occupancy percentage
const averageOccupancy = computed(() => {
  if (props.laboratoryStatistics.length === 0) return 0
  const total = props.laboratoryStatistics.reduce((sum, lab) => sum + lab.occupancy_percentage, 0)
  return +(total / props.laboratoryStatistics.length).toFixed(1)
})

// Displayed laboratories for the comparative bar chart
const displayLaboratories = computed(() => {
  if (props.laboratoryStatistics.length === 0) return []
  let labs = [...props.laboratoryStatistics]

  if (scopeFilter.value === 'high_occupancy') {
    labs = labs.filter(l => l.occupancy_percentage >= 50)
  }

  // Show up to 8 laboratories for clean chart spacing
  return labs.slice(0, 8)
})

// Active highlighted lab (hovered lab, or default to highest occupancy lab)
const activeHighlightedLab = computed(() => {
  if (displayLaboratories.value.length === 0) return null
  if (hoveredLabId.value) {
    return displayLaboratories.value.find(l => l.laboratory_id === hoveredLabId.value) || null
  }
  // Default to highest occupancy
  return [...displayLaboratories.value].sort((a, b) => b.occupancy_percentage - a.occupancy_percentage)[0]
})

// Chart Presentation Mode ('line' default, or 'bar')
const chartType = ref<'line' | 'bar'>('line')

// SVG Chart Geometry Constants
const SVG_WIDTH = 680
const SVG_HEIGHT = 220
const PAD_LEFT = 48
const PAD_RIGHT = 32
const PAD_TOP = 22
const PAD_BOTTOM = 36
const PLOT_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT
const PLOT_HEIGHT = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM

interface ChartPoint {
  index: number
  x: number
  y: number
  lab: LaboratoryStatisticDto
  percentage: number
}

// Compute normalized coordinates for all displayed laboratories
const chartPoints = computed<ChartPoint[]>(() => {
  const labs = displayLaboratories.value
  if (labs.length === 0) return []

  const n = labs.length
  return labs.map((lab, i) => {
    let x = PAD_LEFT + PLOT_WIDTH / 2
    if (n > 1) {
      x = PAD_LEFT + i * (PLOT_WIDTH / (n - 1))
    }
    const pct = Math.min(Math.max(lab.occupancy_percentage || 0, 0), 100)
    const y = PAD_TOP + PLOT_HEIGHT * (1 - pct / 100)

    return {
      index: i,
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      lab,
      percentage: pct,
    }
  })
})

// Compute smooth Catmull-Rom to Cubic Bezier curve path
const splinePath = computed(() => {
  const points = chartPoints.value
  const first = points[0]
  if (!first || points.length === 0) return ''
  if (points.length === 1) return `M ${first.x} ${first.y}`
  
  const second = points[1]
  if (points.length === 2 && second) return `M ${first.x} ${first.y} L ${second.x} ${second.y}`

  let d = `M ${first.x} ${first.y}`
  const lastPoint = points[points.length - 1] || first

  for (let i = 0; i < points.length - 1; i++) {
    const prev = i === 0 ? first : points[i - 1]
    const p0 = prev || first
    const p1 = points[i] || first
    const p2 = points[i + 1] || lastPoint
    const nextNext = i + 2 >= points.length ? lastPoint : points[i + 2]
    const p3 = nextNext || lastPoint

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
})

// Compute closed polygon area path beneath the curve for luminous gradient
const areaPath = computed(() => {
  const points = chartPoints.value
  if (points.length === 0) return ''
  const spline = splinePath.value
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ''
  const baselineY = PAD_TOP + PLOT_HEIGHT

  return `${spline} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`
})

// Benchmark average reference line Y coordinate
const averageY = computed(() => {
  const pct = Math.min(Math.max(averageOccupancy.value || 0, 0), 100)
  return +(PAD_TOP + PLOT_HEIGHT * (1 - pct / 100)).toFixed(2)
})

// Currently active point for tooltips
const activePoint = computed(() => {
  if (!activeHighlightedLab.value) return null
  return chartPoints.value.find(p => p.lab.laboratory_id === activeHighlightedLab.value?.laboratory_id) || null
})

// Dynamic tooltip overlay positioning
const tooltipStyle = computed(() => {
  if (!activePoint.value) return {}
  const pctX = (activePoint.value.x / SVG_WIDTH) * 100
  const pctY = (activePoint.value.y / SVG_HEIGHT) * 100

  let translateX = '-50%'
  if (pctX < 18) translateX = '-15%'
  else if (pctX > 82) translateX = '-85%'

  return {
    left: `${pctX}%`,
    top: `${pctY}%`,
    transform: `translate(${translateX}, -100%) translateY(-14px)`,
  }
})

const tooltipArrowStyle = computed(() => {
  if (!activePoint.value) return {}
  const pctX = (activePoint.value.x / SVG_WIDTH) * 100
  if (pctX < 18) return { left: '20%' }
  if (pctX > 82) return { left: '80%' }
  return { left: '50%' }
})

// Dynamic modern gradient styling for comparative bar chart based on occupancy and active state
function getBarGradientClass(pct: number, isActive: boolean) {
  if (isActive) {
    return 'bg-gradient-to-t from-[#047857] via-[#10b981] to-[#6ee7b7] shadow-lg shadow-emerald-500/35 ring-2 ring-emerald-400 ring-offset-2'
  }
  if (pct >= 75) {
    return 'bg-gradient-to-t from-[#065f46] via-[#059669] to-[#34d399] shadow-sm shadow-emerald-600/25'
  } else if (pct >= 40) {
    return 'bg-gradient-to-t from-[#0c5a30] via-[#0d9488] to-[#2dd4bf] shadow-sm shadow-teal-600/25'
  } else {
    return 'bg-gradient-to-t from-[#1e293b] via-[#0f766e] to-[#14b8a6] shadow-sm shadow-slate-600/25'
  }
}

// Segmented Radial Arc Gauge Ticks Generator (21 ticks for 100% mathematical symmetry)
interface GaugeTick {
  index: number
  x1: number
  y1: number
  x2: number
  y2: number
  isActive: boolean
  color: string
}

const gaugeTicks = computed<GaugeTick[]>(() => {
  const totalTicks = 21
  const cx = 110
  const cy = 118
  const rInner = 74
  const rOuter = 98
  const occ = averageOccupancy.value || 0
  // If there is occupancy > 0, illuminate at least 1 tick
  const activeCount = occ > 0 ? Math.max(1, Math.round((occ / 100) * totalTicks)) : 0

  const ticks: GaugeTick[] = []
  for (let i = 0; i < totalTicks; i++) {
    // Semi-circle from 180° (left) to 360° (right), curving upwards with exact 9° steps
    const angleDeg = 180 + i * (180 / (totalTicks - 1))
    const angleRad = (angleDeg * Math.PI) / 180

    const x1 = +(cx + rInner * Math.cos(angleRad)).toFixed(2)
    const y1 = +(cy + rInner * Math.sin(angleRad)).toFixed(2)
    const x2 = +(cx + rOuter * Math.cos(angleRad)).toFixed(2)
    const y2 = +(cy + rOuter * Math.sin(angleRad)).toFixed(2)

    const isActive = i < activeCount

    // Dynamic color gradation along the arc for modern instrument aesthetic
    let color = '#CBD5E1'
    if (isActive) {
      const progress = i / Math.max(1, totalTicks - 1)
      if (progress < 0.35) color = '#10b981' // Vibrant Emerald
      else if (progress < 0.70) color = '#059669' // Deep Emerald
      else if (progress < 0.90) color = '#34d399' // Luminous Mint
      else color = '#2dd4bf' // Radiant Teal
    }

    ticks.push({ index: i, x1, y1, x2, y2, isActive, color })
  }
  return ticks
})

// Capacity health status indicator
const capacityStatus = computed(() => {
  const occ = averageOccupancy.value
  if (occ === 0) {
    return {
      label: 'Kapasitas Siap',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotClass: 'bg-emerald-500',
    }
  } else if (occ < 30) {
    return {
      label: 'Kapasitas Lapang',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotClass: 'bg-emerald-500',
    }
  } else if (occ < 75) {
    return {
      label: 'Utilisasi Normal',
      badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
      dotClass: 'bg-teal-500',
    }
  } else {
    return {
      label: 'Beban Tinggi',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dotClass: 'bg-amber-500',
    }
  }
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 select-none">

    <!-- 1. LEFT WIDGET: Performance Overview Bar Chart (8 Columns) -->
    <div class="lg:col-span-8 bg-white rounded-3xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 flex flex-col justify-between relative overflow-visible">

      <!-- Header Row with Filter Scope Selector & Chart Type Switcher -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <h3 class="text-base sm:text-lg font-black text-text-primary tracking-tight flex items-center gap-2">
            <span>Ringkasan Kinerja Laboratorium</span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-dark-green text-[10px] font-bold border border-emerald-200/60">
              Tren Okupansi
            </span>
          </h3>
          <p class="text-xs text-text-muted mt-0.5">
            Analisis beban jadwal dan persentase okupansi ruangan laboratorium
          </p>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <!-- Chart Presentation Switcher (Line vs Bar) -->
          <div class="inline-flex items-center p-0.5 rounded-full bg-gray-100/90 border border-gray-200/80 shadow-3xs">
            <button
              type="button"
              @click="chartType = 'line'"
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer',
                chartType === 'line' ? 'bg-white text-dark-green shadow-xs' : 'text-text-muted hover:text-text-primary'
              ]"
              title="Tampilkan Diagram Garis (Line Chart)"
            >
              <TrendingUp :size="13" />
              <span class="text-[11px]">Garis</span>
            </button>
            <button
              type="button"
              @click="chartType = 'bar'"
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer',
                chartType === 'bar' ? 'bg-white text-dark-green shadow-xs' : 'text-text-muted hover:text-text-primary'
              ]"
              title="Tampilkan Diagram Batang (Bar Chart)"
            >
              <BarChart3 :size="13" />
              <span class="text-[11px]">Batang</span>
            </button>
          </div>

          <!-- Scope Filter Pill Button -->
          <div class="relative">
            <button
              @click="isScopeMenuOpen = !isScopeMenuOpen"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold text-text-secondary bg-white hover:bg-surface transition-all duration-150 cursor-pointer shadow-2xs"
            >
              <span>{{ scopeFilter === 'all' ? 'Semua Laboratorium' : 'Beban Tinggi (≥50%)' }}</span>
              <ChevronDown :size="13" class="text-text-muted" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isScopeMenuOpen"
              class="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white border border-gray-100 shadow-xl py-1 z-40 text-xs font-semibold"
            >
              <button
                @click="scopeFilter = 'all'; isScopeMenuOpen = false"
                class="w-full text-left px-3.5 py-2 hover:bg-brand-50/60 transition-colors flex items-center justify-between"
                :class="scopeFilter === 'all' ? 'text-dark-green font-bold bg-brand-50/40' : 'text-text-primary'"
              >
                <span>Semua Laboratorium</span>
                <CheckCircle2 v-if="scopeFilter === 'all'" :size="13" class="text-dark-green" />
              </button>
              <button
                @click="scopeFilter = 'high_occupancy'; isScopeMenuOpen = false"
                class="w-full text-left px-3.5 py-2 hover:bg-brand-50/60 transition-colors flex items-center justify-between"
                :class="scopeFilter === 'high_occupancy' ? 'text-dark-green font-bold bg-brand-50/40' : 'text-text-primary'"
              >
                <span>Beban Tinggi (≥50%)</span>
                <CheckCircle2 v-if="scopeFilter === 'high_occupancy'" :size="13" class="text-dark-green" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State: Skeleton Chart -->
      <div v-if="isLoading" class="h-64 flex items-end justify-around pt-8 pb-4 animate-pulse">
        <div v-for="i in 6" :key="i" class="flex flex-col items-center gap-2">
          <div class="w-11 sm:w-14 bg-gray-100 rounded-3xl h-48 sm:h-52"></div>
          <div class="w-10 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayLaboratories.length === 0" class="h-64 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3 text-dark-green">
          <Activity :size="22" />
        </div>
        <h4 class="text-sm font-bold text-text-primary">Belum Ada Data Laboratorium</h4>
        <p class="text-xs text-text-muted mt-1 max-w-xs">
          Buat ruang laboratorium dan tambahkan jadwal untuk melihat statistik kinerja.
        </p>
      </div>

      <!-- Chart Display Area -->
      <div v-else class="relative w-full pt-4 pb-1">

        <!-- 1. Modern Interactive Spline Line & Area Chart -->
        <div v-if="chartType === 'line'" class="relative w-full">
          <!-- SVG Canvas -->
          <svg
            class="w-full h-60 sm:h-64 overflow-visible"
            :viewBox="`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`"
            preserveAspectRatio="none"
          >
            <defs>
              <!-- Luminous Emerald Area Gradient -->
              <linearGradient id="labAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.38" />
                <stop offset="45%" stop-color="#059669" stop-opacity="0.14" />
                <stop offset="95%" stop-color="#059669" stop-opacity="0.0" />
              </linearGradient>

              <!-- Neon Glow Shadow Filter -->
              <filter id="labLineGlow" x="-10%" y="-30%" width="120%" height="160%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#059669" flood-opacity="0.35" />
              </filter>

              <!-- Luminous Stroke Gradient -->
              <linearGradient id="labStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#047857" />
                <stop offset="50%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#34d399" />
              </linearGradient>
            </defs>

            <!-- 1. Horizontal Reference Gridlines & Y-Axis Labels -->
            <g class="grid-lines pointer-events-none">
              <!-- 100% -->
              <line
                :x1="PAD_LEFT"
                :y1="PAD_TOP"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="PAD_TOP"
                stroke="#f1f5f9"
                stroke-width="1.2"
                stroke-dasharray="4 4"
              />
              <text :x="PAD_LEFT - 8" :y="PAD_TOP + 3.5" text-anchor="end" class="text-[10px] font-mono font-bold fill-gray-400">100%</text>

              <!-- 75% -->
              <line
                :x1="PAD_LEFT"
                :y1="PAD_TOP + PLOT_HEIGHT * 0.25"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="PAD_TOP + PLOT_HEIGHT * 0.25"
                stroke="#f1f5f9"
                stroke-width="1.2"
                stroke-dasharray="4 4"
              />
              <text :x="PAD_LEFT - 8" :y="PAD_TOP + PLOT_HEIGHT * 0.25 + 3.5" text-anchor="end" class="text-[10px] font-mono font-bold fill-gray-400">75%</text>

              <!-- 50% -->
              <line
                :x1="PAD_LEFT"
                :y1="PAD_TOP + PLOT_HEIGHT * 0.5"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="PAD_TOP + PLOT_HEIGHT * 0.5"
                stroke="#f1f5f9"
                stroke-width="1.2"
                stroke-dasharray="4 4"
              />
              <text :x="PAD_LEFT - 8" :y="PAD_TOP + PLOT_HEIGHT * 0.5 + 3.5" text-anchor="end" class="text-[10px] font-mono font-bold fill-gray-400">50%</text>

              <!-- 25% -->
              <line
                :x1="PAD_LEFT"
                :y1="PAD_TOP + PLOT_HEIGHT * 0.75"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="PAD_TOP + PLOT_HEIGHT * 0.75"
                stroke="#f1f5f9"
                stroke-width="1.2"
                stroke-dasharray="4 4"
              />
              <text :x="PAD_LEFT - 8" :y="PAD_TOP + PLOT_HEIGHT * 0.75 + 3.5" text-anchor="end" class="text-[10px] font-mono font-bold fill-gray-400">25%</text>

              <!-- 0% Baseline -->
              <line
                :x1="PAD_LEFT"
                :y1="PAD_TOP + PLOT_HEIGHT"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="PAD_TOP + PLOT_HEIGHT"
                stroke="#cbd5e1"
                stroke-width="1.5"
              />
              <text :x="PAD_LEFT - 8" :y="PAD_TOP + PLOT_HEIGHT + 3.5" text-anchor="end" class="text-[10px] font-mono font-bold fill-gray-400">0%</text>
            </g>

            <!-- 2. Campus Average Benchmark Dashed Line -->
            <g class="benchmark-line pointer-events-none">
              <line
                :x1="PAD_LEFT"
                :y1="averageY"
                :x2="SVG_WIDTH - PAD_RIGHT"
                :y2="averageY"
                stroke="#657E47"
                stroke-width="1.5"
                stroke-dasharray="5 5"
                stroke-opacity="0.6"
              />
              <text
                :x="SVG_WIDTH - PAD_RIGHT"
                :y="averageY - 5"
                text-anchor="end"
                class="text-[9.5px] font-bold fill-[#657E47]"
              >
                Rata-rata: {{ averageOccupancy }}%
              </text>
            </g>

            <!-- 3. Gradient Area Fill beneath Spline -->
            <path
              :d="areaPath"
              fill="url(#labAreaGradient)"
              class="transition-all duration-700 ease-out"
            />

            <!-- 4. Luminous Spline Line Path -->
            <path
              :d="splinePath"
              fill="none"
              stroke="url(#labStrokeGradient)"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              filter="url(#labLineGlow)"
              class="transition-all duration-700 ease-out"
            />

            <!-- 5. Vertical Guidelines, Interactive Node Dots, and X-Axis Labels -->
            <g
              v-for="pt in chartPoints"
              :key="pt.lab.laboratory_id"
              class="node-point-group"
            >
              <!-- Vertical Guideline to X-Axis when Active / Hovered -->
              <line
                v-if="activeHighlightedLab?.laboratory_id === pt.lab.laboratory_id"
                :x1="pt.x"
                :y1="PAD_TOP"
                :x2="pt.x"
                :y2="PAD_TOP + PLOT_HEIGHT"
                stroke="#10b981"
                stroke-width="1.5"
                stroke-dasharray="3 3"
                stroke-opacity="0.8"
                class="transition-all duration-200"
              />

              <!-- Outer Pulse Halo on Active Node -->
              <circle
                v-if="activeHighlightedLab?.laboratory_id === pt.lab.laboratory_id"
                :cx="pt.x"
                :cy="pt.y"
                r="12"
                fill="#10b981"
                fill-opacity="0.25"
                class="animate-pulse"
              />

              <!-- Data Point Node Circle -->
              <circle
                :cx="pt.x"
                :cy="pt.y"
                :r="activeHighlightedLab?.laboratory_id === pt.lab.laboratory_id ? 6.5 : 4.5"
                :fill="activeHighlightedLab?.laboratory_id === pt.lab.laboratory_id ? '#0c5a30' : '#10b981'"
                stroke="#ffffff"
                stroke-width="2.5"
                class="transition-all duration-200 shadow-sm pointer-events-none"
              />

              <!-- X-Axis Code Label -->
              <text
                :x="pt.x"
                :y="PAD_TOP + PLOT_HEIGHT + 20"
                text-anchor="middle"
                class="text-[11px] font-mono font-bold transition-colors pointer-events-none"
                :class="activeHighlightedLab?.laboratory_id === pt.lab.laboratory_id ? 'fill-dark-green font-extrabold text-[12px]' : 'fill-gray-400'"
              >
                {{ pt.lab.laboratory_code }}
              </text>

              <!-- Transparent Hover Detection Column -->
              <rect
                :x="pt.x - (PLOT_WIDTH / (chartPoints.length || 1)) / 2"
                :y="PAD_TOP - 10"
                :width="PLOT_WIDTH / (chartPoints.length || 1)"
                :height="PLOT_HEIGHT + 35"
                fill="transparent"
                class="cursor-pointer"
                @mouseenter="hoveredLabId = pt.lab.laboratory_id"
                @mouseleave="hoveredLabId = null"
              />
            </g>
          </svg>

          <!-- Floating Tooltip Card (Exact match with user's mockup) -->
          <div
            v-if="activeHighlightedLab && activePoint"
            class="absolute pointer-events-none z-30 transition-all duration-200 ease-out"
            :style="tooltipStyle"
          >
            <div class="relative w-48 p-3 bg-white rounded-2xl shadow-xl border border-gray-100">
              <p class="text-xs font-bold text-text-primary mb-1.5 truncate">
                {{ activeHighlightedLab.laboratory_name }}
              </p>
              <div class="space-y-1 text-[11px] text-text-secondary">
                <div class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-dark-green"></span>
                    Total Jadwal
                  </span>
                  <span class="font-bold text-text-primary">{{ activeHighlightedLab.total_schedules }}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#BAD17A]"></span>
                    Total Pemakaian
                  </span>
                  <span class="font-bold text-text-primary">{{ activeHighlightedLab.total_usage }}</span>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs font-extrabold text-dark-green mt-1 pt-1 border-t border-gray-100">
                  <span>Tingkat Okupansi</span>
                  <span>{{ activeHighlightedLab.occupancy_percentage }}%</span>
                </div>
              </div>

              <!-- Downward Triangular Pointer Arrow -->
              <div
                class="w-2.5 h-2.5 bg-white border-r border-b border-gray-100 transform rotate-45 absolute -bottom-1.5 -translate-x-1/2"
                :style="tooltipArrowStyle"
              ></div>
            </div>
          </div>

          <!-- Interactive Legend Sub-bar -->
          <div class="flex items-center justify-between pt-2 px-3 text-xs border-t border-gray-50 mt-1">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-1 rounded-full bg-emerald-500 inline-block"></span>
                <span class="text-[11px] font-semibold text-text-muted">Garis Tren Okupansi (%)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 border-b border-dashed border-[#657E47] inline-block"></span>
                <span class="text-[11px] font-semibold text-text-muted">Rata-rata Kampus ({{ averageOccupancy }}%)</span>
              </div>
            </div>
            <span class="text-[11px] font-bold text-dark-green">
              {{ displayLaboratories.length }} Laboratorium Ditampilkan
            </span>
          </div>
        </div>

        <!-- 2. Traditional Vertical Comparative Bar Chart (Alternative View) -->
        <div v-else class="relative w-full">
          <!-- Chart Plot Canvas -->
          <div class="relative h-60 sm:h-64 w-full flex flex-col justify-end">
            <!-- Subtle Horizontal Grid Lines & Y-Axis Labels -->
            <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
              <div class="border-b border-dashed border-gray-100 w-full flex items-center justify-start">
                <span class="text-[10px] text-gray-400 font-mono -mt-3.5 pl-0.5">100%</span>
              </div>
              <div class="border-b border-dashed border-gray-100 w-full flex items-center justify-start">
                <span class="text-[10px] text-gray-400 font-mono -mt-3.5 pl-0.5">75%</span>
              </div>
              <div class="border-b border-dashed border-gray-100 w-full flex items-center justify-start">
                <span class="text-[10px] text-gray-400 font-mono -mt-3.5 pl-0.5">50%</span>
              </div>
              <div class="border-b border-dashed border-gray-100 w-full flex items-center justify-start">
                <span class="text-[10px] text-gray-400 font-mono -mt-3.5 pl-0.5">25%</span>
              </div>
              <div class="border-b border-gray-200 w-full flex items-center justify-start">
                <span class="text-[10px] text-gray-400 font-mono -mt-3.5 pl-0.5">0%</span>
              </div>
            </div>

            <!-- Campus Average Benchmark Dashed Line -->
            <div
              class="absolute inset-x-0 border-b border-dashed border-[#657E47]/70 z-10 pointer-events-none flex items-center justify-end pr-2 transition-all duration-500"
              :style="{ bottom: `calc(28px + ${Math.min(100, Math.max(0, averageOccupancy)) * 0.76}% )` }"
            >
              <span class="text-[9.5px] font-bold text-[#657E47] bg-white/95 px-1.5 py-0.5 rounded shadow-2xs -mt-3.5 border border-[#657E47]/20">
                Rata-rata: {{ averageOccupancy }}%
              </span>
            </div>

            <!-- Vertical Bars Row -->
            <div class="relative z-20 flex items-end justify-around w-full pl-8 sm:pl-10 h-full pb-7">
              <div
                v-for="(lab, index) in displayLaboratories"
                :key="lab.laboratory_id"
                class="flex flex-col items-center relative group cursor-pointer"
                @mouseenter="hoveredLabId = lab.laboratory_id"
                @mouseleave="hoveredLabId = null"
              >
                <!-- Floating Hover Tooltip Card (Mockup-matched) -->
                <div
                  v-if="activeHighlightedLab?.laboratory_id === lab.laboratory_id"
                  class="absolute bottom-full mb-3 w-48 p-3 bg-white rounded-2xl shadow-xl border border-gray-100 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                  :class="[
                    index === 0 ? 'left-0 translate-x-0' :
                    index === displayLaboratories.length - 1 ? 'right-0 translate-x-0' :
                    'left-1/2 -translate-x-1/2'
                  ]"
                >
                  <p class="text-xs font-bold text-text-primary mb-1.5 truncate">
                    {{ lab.laboratory_name }}
                  </p>
                  <div class="space-y-1 text-[11px] text-text-secondary">
                    <div class="flex items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-dark-green"></span>
                        Total Jadwal
                      </span>
                      <span class="font-bold text-text-primary">{{ lab.total_schedules }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-[#BAD17A]"></span>
                        Total Pemakaian
                      </span>
                      <span class="font-bold text-text-primary">{{ lab.total_usage }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 text-xs font-extrabold text-dark-green mt-1 pt-1 border-t border-gray-100">
                      <span>Tingkat Okupansi</span>
                      <span>{{ lab.occupancy_percentage }}%</span>
                    </div>
                  </div>

                  <!-- Tooltip Bottom Triangle Pointer Arrow -->
                  <div
                    class="w-2.5 h-2.5 bg-white border-r border-b border-gray-100 transform rotate-45 absolute -bottom-1.5"
                    :class="[
                      index === 0 ? 'left-6' :
                      index === displayLaboratories.length - 1 ? 'right-6' :
                      'left-1/2 -translate-x-1/2'
                    ]"
                  ></div>
                </div>

                <!-- Floating Percentage Pill (Above Capsule) -->
                <div
                  class="mb-1.5 transition-all duration-200"
                  :class="activeHighlightedLab?.laboratory_id === lab.laboratory_id ? 'scale-110 -translate-y-0.5' : 'opacity-75 group-hover:opacity-100'"
                >
                  <span
                    class="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md transition-colors inline-block"
                    :class="activeHighlightedLab?.laboratory_id === lab.laboratory_id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/60'"
                  >
                    {{ lab.occupancy_percentage }}%
                  </span>
                </div>

                <!-- Modern Frosted Glass Capsule Pillar Track -->
                <div
                  class="w-11 sm:w-14 h-40 sm:h-44 rounded-3xl relative flex items-end justify-center overflow-visible p-1 cursor-pointer transition-all duration-300"
                  :class="activeHighlightedLab?.laboratory_id === lab.laboratory_id
                    ? 'bg-emerald-50/90 border-2 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-gradient-to-b from-slate-100/90 via-emerald-50/40 to-slate-100/80 border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/60'"
                >
                  <!-- Measurement guide notches inside track (25%, 50%, 75%) -->
                  <div class="absolute inset-y-3 left-1.5 flex flex-col justify-between pointer-events-none opacity-40">
                    <span class="w-1 h-px bg-slate-400"></span>
                    <span class="w-1.5 h-px bg-slate-400"></span>
                    <span class="w-1 h-px bg-slate-400"></span>
                  </div>

                  <!-- Inner Active Bar with Dynamic Luminous Multi-stop Gradient -->
                  <div
                    class="w-full rounded-2xl transition-all duration-700 ease-out relative overflow-hidden group-hover:brightness-105"
                    :class="getBarGradientClass(lab.occupancy_percentage, activeHighlightedLab?.laboratory_id === lab.laboratory_id)"
                    :style="{ height: `${Math.max(8, lab.occupancy_percentage)}%` }"
                  >
                    <!-- Glass Specular Top Sheen Highlight -->
                    <div class="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-white/40 via-white/15 to-transparent rounded-t-xl pointer-events-none"></div>

                    <!-- Vertical Sheen Line -->
                    <div class="absolute inset-y-1 left-1 w-0.5 bg-white/25 rounded-full pointer-events-none"></div>
                  </div>

                  <!-- Top Cap Jewel / Pearl Halo for Active/Hovered Bar -->
                  <div
                    v-if="activeHighlightedLab?.laboratory_id === lab.laboratory_id"
                    class="w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-500 absolute z-20 shadow-md shadow-emerald-500/50 -translate-x-1/2 left-1/2 transition-all duration-700 flex items-center justify-center"
                    :style="{ bottom: `calc(${Math.max(8, lab.occupancy_percentage)}% - 7px)` }"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                  </div>
                </div>

                <!-- X-Axis Label -->
                <span
                  class="text-[11px] font-mono mt-2 block text-center transition-all duration-200"
                  :class="activeHighlightedLab?.laboratory_id === lab.laboratory_id
                    ? 'text-dark-green font-black scale-105'
                    : 'text-text-muted font-bold group-hover:text-text-primary'"
                >
                  {{ lab.laboratory_code }}
                </span>
              </div>
            </div>
          </div>

          <!-- Interactive Legend Sub-bar -->
          <div class="flex items-center justify-between pt-2 px-3 text-xs border-t border-gray-50 mt-1">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-2 rounded-sm bg-gradient-to-r from-emerald-600 to-teal-400 inline-block"></span>
                <span class="text-[11px] font-semibold text-text-muted">Tingkat Okupansi (%)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 border-b border-dashed border-[#657E47] inline-block"></span>
                <span class="text-[11px] font-semibold text-text-muted">Rata-rata Kampus ({{ averageOccupancy }}%)</span>
              </div>
            </div>
            <span class="text-[11px] font-bold text-dark-green">
              {{ displayLaboratories.length }} Laboratorium Ditampilkan
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- 2. RIGHT WIDGET: Segmented Radial Arc Gauge & Dual KPIs (4 Columns) -->
    <div class="lg:col-span-4 bg-white rounded-3xl border border-gray-200/70 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">

      <!-- Header Row -->
      <div class="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 class="text-base sm:text-lg font-black text-text-primary tracking-tight">
            Tingkat Pemanfaatan Lab
          </h3>
          <p class="text-xs text-text-muted mt-0.5">
            Kapasitas dan utilisasi laboratorium institusi
          </p>
        </div>

        <button
          class="w-8 h-8 rounded-full hover:bg-surface text-text-muted hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
          title="Opsi lainnya"
        >
          <MoreHorizontal :size="16" />
        </button>
      </div>

      <!-- Segmented Radial Arc Gauge (21 Ticks, Perfectly Symmetrical) -->
      <div class="my-2 flex flex-col items-center justify-center">
        <div class="relative w-60 h-38 sm:h-40 flex items-center justify-center">

          <!-- SVG Radial Gauge -->
          <svg class="w-60 h-38 sm:h-40 overflow-visible" viewBox="0 0 220 132">
            <defs>
              <!-- Luminous glow filter for active ticks -->
              <filter id="gaugeActiveGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#10b981" flood-opacity="0.55" />
              </filter>
            </defs>

            <!-- Render 21 Perfectly Symmetrical Radial Ticks (9° steps, vertical at center) -->
            <line
              v-for="tick in gaugeTicks"
              :key="tick.index"
              :x1="tick.x1"
              :y1="tick.y1"
              :x2="tick.x2"
              :y2="tick.y2"
              :stroke="tick.color"
              :stroke-width="tick.isActive ? 8.5 : 7"
              stroke-linecap="round"
              :filter="tick.isActive ? 'url(#gaugeActiveGlow)' : undefined"
              class="transition-all duration-700 ease-out"
            />
          </svg>

          <!-- Center Metric: Proportionate Percentage & Health Status -->
          <div class="absolute inset-x-0 bottom-2 text-center flex flex-col items-center justify-center pointer-events-none">
            <!-- Ambient Soft Radial Glow -->
            <div class="absolute -top-4 w-20 h-12 rounded-full bg-emerald-500/10 blur-lg pointer-events-none -z-10"></div>

            <div class="flex items-baseline justify-center">
              <span class="text-2xl font-black text-slate-800 tracking-tight font-sans leading-none">
                {{ averageOccupancy }}
              </span>
              <span class="text-xs font-bold text-emerald-600 ml-0.5">%</span>
            </div>
            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
              Beban Kapasitas
            </span>

            <!-- Dynamic Health Status Badge -->
            <div class="mt-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border inline-flex items-center gap-1 shadow-2xs transition-all duration-300"
                :class="capacityStatus.badgeClass"
              >
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="capacityStatus.dotClass" />
                {{ capacityStatus.label }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dual Bottom KPI Cards (Directly below Gauge) -->
      <div class="grid grid-cols-2 gap-3 mt-4">
        <!-- Card 1: Active Laboratories -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50/90 via-emerald-50/20 to-slate-50/70 border border-slate-200/70 hover:border-emerald-300 hover:shadow-xs transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-wider">
              Lab Aktif Operasional
            </span>
            <div class="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <Activity :size="13" />
            </div>
          </div>

          <div class="flex items-baseline justify-between gap-1">
            <span class="text-base font-black text-slate-800">
              {{ activeLabs }} <span class="text-xs font-bold text-slate-400">/ {{ totalLabs }} Lab</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold border border-emerald-300/60 inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </span>
          </div>

          <!-- Micro Progress Bar -->
          <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div
              class="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700"
              :style="{ width: `${totalLabs > 0 ? (activeLabs / totalLabs) * 100 : 0}%` }"
            ></div>
          </div>
        </div>

        <!-- Card 2: Weekly Sessions -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50/90 via-teal-50/20 to-slate-50/70 border border-slate-200/70 hover:border-teal-300 hover:shadow-xs transition-all duration-300 flex flex-col justify-between space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-wider">
              Sesi Praktikum
            </span>
            <div class="w-6 h-6 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center">
              <Calendar :size="13" />
            </div>
          </div>

          <div class="flex items-baseline justify-between gap-1">
            <span class="text-base font-black text-slate-800">
              {{ totalSchedules }} <span class="text-xs font-bold text-slate-400">Sesi</span>
            </span>
            <span class="px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-800 text-[10px] font-extrabold border border-teal-300/60 inline-flex items-center gap-1">
              {{ totalUsages }} Terlaksana
            </span>
          </div>

          <!-- Micro Progress Bar (Mirrors Card 1) -->
          <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div
              class="bg-gradient-to-r from-teal-600 to-emerald-400 h-full rounded-full transition-all duration-700"
              :style="{ width: `${totalSchedules > 0 ? Math.min(100, (totalUsages / totalSchedules) * 100) : (totalUsages > 0 ? 100 : 0)}%` }"
            ></div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>


