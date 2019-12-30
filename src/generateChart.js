import ApexCharts from 'apexcharts';
import { flatMap, countBy, map, sortBy } from 'lodash';

export function generateChart () {
    const [leftColumn, rightColumn] = getRightAndLeftColumns()
  
    const climbContainerElementsByGrade = groupByGrade(leftColumn)
    const climbs = flatMap(
      climbContainerElementsByGrade,
      (elements, grade) => flatMap(elements, elem => getClimbTypes(elem).map(type => ({ type, grade })))
    )
  
    const climbTypeCounts = countBy(climbs, climb => climb.type)
  
    const newNode = document.createElement('div');
    newNode.className = "row"
    if (rightColumn.children.length < 2) {
      return
    }
    rightColumn.insertBefore(newNode, rightColumn.children[1]);
  
    const data = map(climbTypeCounts, (count, type) => [type, count])
    const sortedData = sortBy(data, v => -v[1])
    const top15Values = sortedData.slice(0, 15)
  
    const options = {
        chart: {
          type: 'bar'
        },
        series: [{
          name: 'Number of Problems',
          data: top15Values.map(v => v[1])
        }],
        xaxis: {
          categories: top15Values.map(v => v[0])
        }
      }
        
    const chart = new ApexCharts(newNode, options);
    
    chart.render();
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
  
  const groupByGrade = leftColumn => {
    const climbContainersByGrades = {}
    let currentGrade
    for (const elem of leftColumn.children) {
      if (isGradeHeadingElement(elem)) {
        currentGrade = elem.innerText.trim()
        climbContainersByGrades[currentGrade] = []
      } else if (isClimbContainerElement(elem) && currentGrade != null) {
        climbContainersByGrades[currentGrade].push(elem)
      }
    }
    return climbContainersByGrades
  }
  
  const getClimbTypes = elem => {
    const typesElem = elem.querySelector(".btype")
    if (typesElem == null) {
      return [];
    }
    return typesElem.innerText.split(",").map(t => t.trim())
  }
  