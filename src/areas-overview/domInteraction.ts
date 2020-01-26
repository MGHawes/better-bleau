import { flatMap, map, mapValues, groupBy } from "lodash-es"
import { getRightAndLeftColumns, extractClimbsFromDom } from "../single-area/domInteraction";
import { IClimb, getTopNClimbTypes, ITopClimbTypesWithCounts } from "../single-area/dataProcessing";
import { IAreaMetric } from "./generateAreasOverviewCharts";

const BLEAU_DOT_INFO_DEFAULT_LIGHT_GREY = "#777"

export interface IAreaLink {
    href: string;
    element: Element;
}
export const extractAreaLinksFromDom = (): IAreaLink[] => 
  flatMap(
      document.querySelector("main div.container .row-same-height:not(#fav_areas_row)").children,
      col => map(col.children, element => ({ href: element.querySelector("a").href, element }))
    )

export interface ISingleAreaData {
  numClimbs: number;
  topClimbTypes: ITopClimbTypesWithCounts;
}
export const extractSingleAreaData = (doc: Document): ISingleAreaData => {
  const [leftColumn] = getRightAndLeftColumns(doc);
  const climbs = extractClimbsFromDom(leftColumn).filter(c => c.climbTypes.length > 0);

  const topClimbTypes = getTopNClimbTypes(climbs, 3);

  return { numClimbs: climbs.length, topClimbTypes }
}

export const createPerAreaMetricsSubtextElement = ({ topClimbTypes, numClimbs, element }: IAreaMetric): void => {
  const metricsContainer = document.createElement("div");
  metricsContainer.style.color = BLEAU_DOT_INFO_DEFAULT_LIGHT_GREY

  metricsContainer.innerText = `${numClimbs} - ${topClimbTypes.map(t => t[0]).join(", ")}`;

  element.appendChild(metricsContainer)
}

const DISTRIBUTION_CHART_ID = "distribution_chart"
export const createChartElement = (): HTMLElement => {
  const chartsContainer = document.createElement("div");
  chartsContainer.className = "row"
  chartsContainer.style.marginTop = "20px"

  const pageContentContainerElement = document.querySelector("main > div.container")
  pageContentContainerElement.insertBefore(chartsContainer, pageContentContainerElement.firstChild)
  
  const distributionChartContainer = document.createElement("div");
  chartsContainer.appendChild(distributionChartContainer)

  const distributionChartElement = document.createElement("svg")
  distributionChartElement.id = DISTRIBUTION_CHART_ID;
  distributionChartElement.style.width = "100%";
  distributionChartElement.style.height = "350px";
  distributionChartElement.style.display = "block";
  distributionChartContainer.appendChild(distributionChartElement);

  return distributionChartElement
}
