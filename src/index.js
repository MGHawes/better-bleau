import { generateSingleAreaChart } from "./single-area/generateSingleAreaChart"
import { generateAreasOverviewCharts } from "./areas-overview/generateAreasOverviewCharts"

const strippedPathname = window.location.pathname.replace(/\//g, "")
if (strippedPathname === "areas") {
  generateAreasOverviewCharts()
} else {
  generateSingleAreaChart();
}
