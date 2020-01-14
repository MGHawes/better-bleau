import { generateChart } from "./generateChart"
import { computeAreaMetrics } from "./areaMetrics"

const strippedPathname = window.location.pathname.replace(/\//g, "")
if (strippedPathname === "areas") {
  computeAreaMetrics()
} else {
  generateChart();
}
