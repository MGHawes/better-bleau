import ApexCharts from 'apexcharts';
import { flatMap, countBy, map, sortBy, mapValues, reverse, groupBy } from 'lodash';

const NUM_CLIMB_TYPES_TO_SHOW = 10
const APPROXIMATE_LABEL_WIDTH_IN_PIXELS = 50
const SMALLEST_VISIBLE_LABEL_WIDTH_IN_PIXELS = 25

export function generateChart () {
  const [leftColumn, rightColumn] = getRightAndLeftColumns()
  const rawClimbs = extractClimbsFromDom(leftColumn)
  const climbDomElementsByGrade = groupByGrade(rawClimbs)
  
  const climbTypesByGrade = mapValues(
    climbDomElementsByGrade,
    elements => flatMap(elements, getClimbTypes)
  )
  const topClimbTypes = getTopNClimbTypes(climbTypesByGrade, NUM_CLIMB_TYPES_TO_SHOW)
  const maxCount = topClimbTypes[0][1]

  const climbTypeCountsByGrade = mapValues(
    climbTypesByGrade,
    climbTypes => countBy(climbTypes)
  )

  const chartSeries = map(
    climbTypeCountsByGrade,
    (countsByType, grade) => ({
      name: grade.toString(),
      data: topClimbTypes.map(([type, _]) => type.toString() in countsByType ? countsByType[type] : 0)
    })
  )

  const newElement = createChartElement(rightColumn)
  const chartBarsLength = newElement.clientWidth - APPROXIMATE_LABEL_WIDTH_IN_PIXELS
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
      series: reverse(chartSeries),
      xaxis: {
        categories: topClimbTypes.map(([type, _]) => toTitleCase(type)),
      }
    }
      
  const chart = new ApexCharts(newElement, options);

  chart.render();
}

const createChartElement = rightColumn => {
  const chartElement = document.createElement('div');
  chartElement.className = "row"
  chartElement.style.width = "100%"
  if (rightColumn.children.length < 2) {
    rightColumn.appendChild(chartElement)
  } else {
    rightColumn.insertBefore(chartElement, rightColumn.children[1]);
  }
  
  return chartElement
}

const getTopNClimbTypes = (climbTypesByGrade, n) => {
  const allClimbTypeCounts = countBy(flatMap(climbTypesByGrade))
  const topNClimbTypes = sortBy(
    map(allClimbTypeCounts, (v, k) => [k, v]),
    ([k, v]) => -v, 
  ).slice(0, n)

  return topNClimbTypes;
}

const getRightAndLeftColumns = () => {
  const mainContent = document.querySelector("main div.container")
  if (mainContent == null) {
    throw "Couldn't find main container element"
  }
  const rightColumn = mainContent.querySelector(".pull-right")
  const leftColumn = mainContent.querySelector(":not(.pull-right).col-md-6")
  if (rightColumn == null || leftColumn == null) {
    throw "Couldn't find left right columns";
  }

  return [leftColumn, rightColumn]
}

const isClimbContainerElement = elem => elem.tagName === "DIV" && elem.className === "vsr"
const isGradeHeadingElement = elem => elem.tagName === "H4"

const groupByGrade = rawClimbs => {
  const climbDomElementsByGrade = mapValues(
    groupBy(rawClimbs, ({ gradeText }) => parseGrade(gradeText)),
    climbs => map(climbs, "element"),
  )
  return climbDomElementsByGrade
}

const extractClimbsFromDom = leftColumn => {
  const climbs = []
  let gradeText
  for (const element of leftColumn.children) {
    if (isGradeHeadingElement(element)) {
      gradeText = element.innerText.trim()
    } else if (isClimbContainerElement(element) && gradeText != null) {
      climbs.push({ gradeText, element })
    }
  }
  return climbs
}

const parseGrade = gradeText => {
  const grade = Number(gradeText.trim().slice(0, 1))
  if (isNaN(grade)) {
    return "Unknown"
  }
  if (grade < 5) {
    return "< 5"
  }
  return `${grade}s`
}

const getClimbTypes = elem => {
  const typesElem = elem.querySelector(".btype")
  if (typesElem == null) {
    return [];
  }
  return typesElem.innerText.split(",").map(parseClimbType)
}

const parseClimbType = typeString => {
  const type = typeString.trim()
  if (type.search(/[Tt]raverse/) != -1) {
    return "traverse"
  }
  return type
}

function toTitleCase(str) {
  return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}