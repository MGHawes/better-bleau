import ApexCharts from 'apexcharts';
import { flatMap, countBy, map, groupBy, mapValues, reverse } from 'lodash';
import { extractClimbsFromDom, getRightAndLeftColumns, createChartElement } from "./domInteraction";
import { getTopNClimbTypes, parseClimbTypesString, parseGradeText } from "./dataProcessing"

const NUM_CLIMB_TYPES_TO_SHOW = 10
const APPROXIMATE_LABEL_WIDTH_IN_PIXELS = 50
const SMALLEST_VISIBLE_LABEL_WIDTH_IN_PIXELS = 25

export function generateChart () {
  const [leftColumn, rightColumn] = getRightAndLeftColumns()
  const chartElement = createChartElement(rightColumn)
  const rawClimbs = extractClimbsFromDom(leftColumn)

  const rawClimbsByGrade = groupBy(rawClimbs, ({ gradeText }) => parseGradeText(gradeText))
  const climbTypesByGrade = mapValues(
    rawClimbsByGrade,
    climbs => flatMap(climbs, climb => parseClimbTypesString(climb.climbTypesString))
  )
  const topClimbTypes = getTopNClimbTypes(climbTypesByGrade, NUM_CLIMB_TYPES_TO_SHOW)
  const maxCount = topClimbTypes[0][1]

  const climbTypeCountsByGrade = mapValues(
    climbTypesByGrade,
    climbTypes => countBy(climbTypes)
  )

  const chartSeries = reverse(
    map(
      climbTypeCountsByGrade,
      (countsByType, grade) => ({
        name: grade.toString(),
        data: topClimbTypes.map(([type, _]) => type.toString() in countsByType ? countsByType[type] : 0)
      })
  ))
  
  const chartXAxisCategories = topClimbTypes.map(([type, _]) => toTitleCase(type))
  renderChart(chartElement, chartSeries, chartXAxisCategories, maxCount)
}

function toTitleCase(str) {
  return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

const renderChart = (chartElement, chartSeries, categories, maxCount) => {
  const chartBarsLength = chartElement.clientWidth - APPROXIMATE_LABEL_WIDTH_IN_PIXELS
  const options = {
      chart: {
        type: "bar",
        height: 350,
        stacked: true,
        toolbar: {
          show: true
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: val => 
          // HACK HACK: Labels render even when there isn't enough room in the bar
          (val / maxCount) > (SMALLEST_VISIBLE_LABEL_WIDTH_IN_PIXELS / chartBarsLength)
            ? val.toString() : "",
      },
      series: chartSeries,
      xaxis: {
        categories,
      }
    }
      
  const chart = new ApexCharts(chartElement, options);

  chart.render();
}