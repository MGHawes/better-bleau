import * as d3 from "d3";
import { ceil, floor, groupBy, mapValues, maxBy, range } from "lodash-es";
import * as Plottable from "plottable";
import {
  createChartElement,
  createPerAreaMetricsSubtextElement,
  extractAreaLinksFromDom,
  extractSingleAreaData,
  ISingleAreaData,
} from "./domInteraction";

export interface IAreaMetric extends ISingleAreaData {
  element: Element;
}
interface IError {
  error: any;
  isError: true;
}
const isNotError = (v: IAreaMetric | IError): v is IAreaMetric =>
  v.hasOwnProperty("isError") && (v as IError).isError === true;

export const generateAreasOverviewCharts = () => {
  const areaElements = extractAreaLinksFromDom();
  const areaMetricsPromises: Array<Promise<IAreaMetric | IError>> = areaElements.map(({ element, href }) =>
    fetch(href)
      .then((resp) => resp.text())
      .then((htmlString) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, "text/html");

          return { ...extractSingleAreaData(doc), element };
      })
      .catch((error) => ({ error, element, isError: true as const })),
  );

  Promise.all(areaMetricsPromises).then((maybeAreaMetrics) => {
    const areaMetrics = maybeAreaMetrics.filter<IAreaMetric>(isNotError);

    areaMetrics.forEach(createPerAreaMetricsSubtextElement);

    const distributionChartElement = createChartElement();

    const buckets = bucketData(areaMetrics);

    initializeChart(buckets, distributionChartElement);
  });
};

const NUM_BUCKETS = 50;
interface IBucket {
  midpoint: number;
  numClimbs: number;
}
const bucketData = (areaMetrics: IAreaMetric[]): IBucket[] => {
  const stepsize = ceil(maxBy(areaMetrics, (b) => b.numClimbs).numClimbs / NUM_BUCKETS);
  const numClimbsByBucket = mapValues(
    groupBy(areaMetrics, (m) => floor(m.numClimbs / stepsize)),
    (metrics) => metrics.length,
  );

  const buckets = range(0, (NUM_BUCKETS - 1) * stepsize, stepsize)
    .map((lowerBound, i) => ({ midpoint: lowerBound + stepsize / 2, numClimbs: numClimbsByBucket[i] || 0 }));

  return buckets;
};

const initializeChart = (buckets: IBucket[], chartElement: HTMLElement) => {
  const xScale = new Plottable.Scales.Linear();
  const yScale = new Plottable.Scales.Linear();
  const xAxis = new Plottable.Axes.Numeric(xScale, "bottom");
  const yAxis = new Plottable.Axes.Numeric(yScale, "left");

  const plot = new Plottable.Plots.Bar()
    .x((d: IBucket) => d.midpoint, xScale)
    .y((d: IBucket) => d.numClimbs, yScale)
    .addDataset(new Plottable.Dataset(buckets));

  const dragbox = new Plottable.Components.XDragBoxLayer();
  dragbox.onDrag((box) => {
    plot.selections().attr("fill", "#5279c7");
    plot.entitiesIn(box).forEach((entity) => {
      entity.selection.attr("fill", "#FD373E");
    });
  });

  new Plottable.Components.Table([
    [yAxis, new Plottable.Components.Group([dragbox, plot])],
    [null, xAxis],
  ]).renderTo(chartElement);
};
