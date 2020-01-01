import ApexCharts from "apexcharts";
import { countBy, flatMap, groupBy, map, mapValues, reverse, some } from "lodash";
import { getTopNClimbTypes, parseClimbTypesString, parseGradeText } from "./dataProcessing";
import { createChartContainer, createChartElement, extractClimbsFromDom, extractGradeHeaderFromDom, getRightAndLeftColumns } from "./domInteraction";

const NUM_CLIMB_TYPES_TO_SHOW = 10;
const APPROXIMATE_LABEL_WIDTH_IN_PIXELS = 50;
const SMALLEST_VISIBLE_LABEL_WIDTH_IN_PIXELS = 25;

export function generateChart() {
  const [leftColumn, rightColumn] = getRightAndLeftColumns();
  const rawClimbs = extractClimbsFromDom(leftColumn);
  const rawGradeHeaders = extractGradeHeaderFromDom(leftColumn);

  const climbsWithGradeAndTypes = rawClimbs.map(
    (climb) => ({
      ...climb,
      grade: parseGradeText(climb.gradeText),
      types: parseClimbTypesString(climb.climbTypesString),
    }
  ));
  const climbTypesByGrade = mapValues(
    groupBy(climbsWithGradeAndTypes, "grade"),
    (climbs) => flatMap(climbs, (climb) => climb.types),
  );

  const topClimbTypes = getTopNClimbTypes(climbTypesByGrade, NUM_CLIMB_TYPES_TO_SHOW);
  const maxCount = topClimbTypes[0][1];

  const climbTypeCountsByGrade = mapValues(
    climbTypesByGrade,
    (climbTypes) => countBy(climbTypes),
  );

  const chartSeries = reverse(
    map(
      climbTypeCountsByGrade,
      (countsByType, grade) => ({
        name: grade.toString(),
        data: topClimbTypes.map(([type, _]) => type.toString() in countsByType ? countsByType[type] : 0),
      }),
  ));

  const chartXAxisCategories = topClimbTypes.map(([type, _]) => type);
  const onSelectBar = (e: any, chart: any, options: { selectedDataPoints: any}) => {
    const { selectedGrades, selectedGradeTypePairs } = parseChartSelection(options.selectedDataPoints, chartSeries, chartXAxisCategories);

    const isSelected = selectedGradeTypePairs.size === 0
      ? () => true
      : (climb) => some(climb.types.map((type) => selectedGradeTypePairs.has([climb.grade, type].toString())));

    climbsWithGradeAndTypes.forEach((climb) => climb.element.style.display = isSelected(climb) ? "block" : "none");
    rawGradeHeaders.forEach((header) =>
      header.element.style.display = selectedGrades.has(parseGradeText(header.gradeText)) ? "block" : "none");
  };
  const { chartContainerElement, resetSelectionButton } = createChartContainer(rightColumn);
  const chartElement = createChartElement(chartContainerElement);
  let chart = renderChart(chartElement, chartSeries, chartXAxisCategories, maxCount, onSelectBar);

  // HACK HACK: Needed to reset chart selection in one go
  const hardRefreshSelection = () => {
    chart.destroy();
    chart = renderChart(chartElement, chartSeries, chartXAxisCategories, maxCount, onSelectBar);
    climbsWithGradeAndTypes.forEach((climb) => climb.element.style.display = "block");
    rawGradeHeaders.forEach((header) => header.element.style.display = "block");
  };
  resetSelectionButton.addEventListener("click", hardRefreshSelection);
}

function toTitleCase(str: string): string {
  return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

const renderChart = (
    chartElement: HTMLDivElement,
    chartSeries: Array<{ name: string; data: number[]; }>,
    categories: string[],
    maxCount: number,
    onSelectBar: (e: any, chart: any, options: { selectedDataPoints: any}) => void,
  ) => {
    const chartBarsLength = chartElement.clientWidth - APPROXIMATE_LABEL_WIDTH_IN_PIXELS;
    const options = {
        chart: {
          type: "bar",
          height: 350,
          width: 580,
          stacked: true,
          events: {
            dataPointSelection: onSelectBar,
          },
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: true,
          },
        },
        dataLabels: {
          enabled: true,
          formatter: (val) =>
            // HACK HACK: Labels render even when there isn't enough room in the bar
            (val / maxCount) > (SMALLEST_VISIBLE_LABEL_WIDTH_IN_PIXELS / chartBarsLength)
              ? val.toString() : "",
        },
        series: chartSeries,
        xaxis: {
          categories: categories.map(toTitleCase),
        },
        states: {
          active: {
            allowMultipleDataPointsSelection: true,
          },
        },
      };

    const chart = new ApexCharts(chartElement, options);

    chart.render();

    return chart;
};

const parseChartSelection = (
  selectedDataPoints: number[][],
  chartSeries: Array<{ name: string }>,
  xAxisCategories: string[],
  ) => {
    const selectedGrades = new Set();
    const selectedGradeTypePairs = new Set();

    selectedDataPoints.forEach((seriesPoints: number[], seriesIndex: number) => {
      const grade = chartSeries[seriesIndex].name;
      if (seriesPoints.length > 0) {
        selectedGrades.add(grade);
      }
      seriesPoints.forEach((pointIndex) => selectedGradeTypePairs.add([grade, xAxisCategories[pointIndex]].toString()));
    });

    return { selectedGrades, selectedGradeTypePairs };
};
