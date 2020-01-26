import { groupBy, mapValues, maxBy, ceil, range, floor } from "lodash-es"
import * as Plottable from "plottable";
import * as d3 from "d3";
import { extractAreaLinksFromDom, extractSingleAreaData, ISingleAreaData, createPerAreaMetricsSubtextElement, createChartElement } from "./domInteraction";


export interface IAreaMetric extends ISingleAreaData {
  element: Element;
}
interface IError {
  error: any;
  isError: true;
}
const isNotError = (v: IAreaMetric | IError): v is IAreaMetric => v.hasOwnProperty("isError") && (v as IError).isError === true

export const generateAreasOverviewCharts = () => {
  const areaElements = extractAreaLinksFromDom()
  const areaMetricsPromises: Promise<IAreaMetric | IError>[] = areaElements.map(({ element, href }) => 
    fetch(href)
      .then(resp => resp.text())
      .then(htmlString => {
          var parser = new DOMParser();
          var doc = parser.parseFromString(htmlString, "text/html");
          
          return { ...extractSingleAreaData(doc), element };
      })
      .catch(error => ({ error, element, isError: true as const }))
  )

  Promise.all(areaMetricsPromises).then(maybeAreaMetrics => {
    const areaMetrics = maybeAreaMetrics.filter<IAreaMetric>(isNotError)

    areaMetrics.forEach(createPerAreaMetricsSubtextElement)

    const distributionChartElement = createChartElement()
    
    console.log(areaMetrics)
    console.log(JSON.stringify(areaMetrics))
    const buckets = bucketData(areaMetrics)
    console.log(buckets)
    initializeChart(buckets, distributionChartElement)
  });
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