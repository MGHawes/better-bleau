import { flatMap, map, groupBy, mapValues, keyBy, maxBy, ceil, range, floor } from "lodash-es"
import * as Plottable from "plottable";
import * as d3 from "d3";
import { getRightAndLeftColumns, extractClimbsFromDom } from "./domInteraction";
import { IClimb, getTopNClimbTypes } from "./dataProcessing";

const DISTRIBUTION_CHART_ID = "distribution_chart"

export const computeAreaMetrics = () => {
  const areaElements = flatMap(
    document.querySelector("main div.container .row-same-height:not(#fav_areas_row)").children,
    col => Array.from(col.children)
  )
  const areaMetricsPromise = areaElements.map(elem => {
    const href = elem.querySelector("a").href

    return fetch(href)
      .then(resp => resp.text())
      .then(htmlString => {
          var parser = new DOMParser();
          var doc = parser.parseFromString(htmlString, "text/html");
          try {
            const [leftColumn] = getRightAndLeftColumns(doc);
            const climbs = extractClimbsFromDom(leftColumn);
          
            const climbsWithTypes = climbs.filter(c => c.climbTypes.length > 0)
            const climbTypesByGrade = mapValues(
              groupBy(climbsWithTypes, (c) => c.gradeCategory),
              (groupedClimbs: IClimb[]) => flatMap(groupedClimbs, (climb) => climb.climbTypes),
            );
          
            const topClimbTypes = getTopNClimbTypes(climbTypesByGrade, 3);

            return { topClimbTypes, numClimbs: climbs.length, elem, error: false };
          } catch (err) {
            return { err, elem, error: true };
          }
      })
      .catch(err => ({ err, elem, error: true }))}
  )

  Promise.all(areaMetricsPromise)
  .then(areaMetrics => {
    areaMetrics.filter(m => m.error === false).map(
      ({ topClimbTypes, numClimbs, elem }: any) => {
        const metricsContainer = document.createElement("div");
        metricsContainer.style.color = "#777"

        metricsContainer.innerText = `${numClimbs} - ${topClimbTypes.map(t => t[0]).join(", ")}`;

        elem.appendChild(metricsContainer)
      }
    )

    const chartsContainer = document.createElement("div");
    chartsContainer.className = "row"
    chartsContainer.style.marginTop = "20px"
    const containerElement = document.querySelector("main > div.container")
    containerElement.insertBefore(chartsContainer, containerElement.firstChild)
    
    const distributionChartContainer = document.createElement("div");
    chartsContainer.appendChild(distributionChartContainer)

    const distributionChartElement = document.createElement("svg")
    distributionChartElement.id = DISTRIBUTION_CHART_ID;
    distributionChartElement.style.width = "100%";
    distributionChartElement.style.height = "350px";
    distributionChartElement.style.display = "block";
    distributionChartContainer.appendChild(distributionChartElement);
    console.log(areaMetrics)
    console.log(JSON.stringify(areaMetrics))
    const buckets = bucketData(areaMetrics as any)
    console.log(buckets)
    initializeChart(buckets, distributionChartElement)
  });
}

interface IAreaMetric {
  name: string;
  numClimbs: number;
  topClimbTypes: string[];
}
const NUM_BUCKETS = 50;
interface IBucket {
  midpoint: number;
  numClimbs: number;
}
const bucketData = (areaMetrics: IAreaMetric[]): IBucket[] => {
  const stepsize = ceil(maxBy(areaMetrics, b => b.numClimbs).numClimbs / NUM_BUCKETS)
  const numClimbsByBucket = mapValues(
    groupBy(areaMetrics, m => floor(m.numClimbs / stepsize)),
    metrics => metrics.length
  )

  const buckets = range(0, (NUM_BUCKETS - 1) * stepsize, stepsize)
    .map((lowerBound, i) => ({ midpoint: lowerBound + stepsize / 2, numClimbs: numClimbsByBucket[i] || 0 }))

  return buckets;
}


const initializeChart = (buckets: IBucket[], chartElement: HTMLElement) => {
  var xScale = new Plottable.Scales.Linear();
  var yScale = new Plottable.Scales.Linear();
  var xAxis = new Plottable.Axes.Numeric(xScale, "bottom");
  var yAxis = new Plottable.Axes.Numeric(yScale, "left");


  var plot = new Plottable.Plots.Bar()
    .x((d: IBucket) => d.midpoint, xScale)
    .y((d: IBucket) => d.numClimbs, yScale)
    .addDataset(new Plottable.Dataset(buckets));

  var dragbox = new Plottable.Components.XDragBoxLayer();
  dragbox.onDrag(function(box) {
    plot.selections().attr("fill", "#5279c7");
    plot.entitiesIn(box).forEach(function(entity) {
      console.log(entity)
      entity.selection.attr("fill", "#FD373E");
    });
  });

  new Plottable.Components.Table([
    [yAxis, new Plottable.Components.Group([dragbox, plot])],
    [null, xAxis]
  ]).renderTo(chartElement);
}