const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()

type GoogleTag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GoogleTag
  }
}

let initialized = false

export function initializeAnalytics() {
  if (!measurementId || initialized || typeof window === 'undefined') return

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  // React Router の画面遷移を別途送るため、自動 page_view は止める。
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
  initialized = true
}

export function trackPageView(path: string) {
  if (!measurementId) return
  initializeAnalytics()
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  })
}

export function trackAnalyticsEvent(name: string, parameters: Record<string, string | number>) {
  if (!measurementId) return
  initializeAnalytics()
  window.gtag?.('event', name, parameters)
}
