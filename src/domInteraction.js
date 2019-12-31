
export const extractClimbsFromDom = leftColumn => {
  const climbs = []
  let gradeText
  for (const element of leftColumn.children) {
      if (isGradeHeadingElement(element)) {
      gradeText = element.innerText.trim()
  } else if (isClimbContainerElement(element) && gradeText != null) {
      climbs.push({ gradeText, climbTypesString: extractClimbTypes(element), element })
    }
  }
  return climbs
}

const extractClimbTypes = elem => {
  const typesElem = elem.querySelector(".btype")
  if (typesElem == null) {
    return "";
  }
  return typesElem.innerText
}

export const getRightAndLeftColumns = () => {
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

export const createChartElement = rightColumn => {
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

const isClimbContainerElement = elem => elem.tagName === "DIV" && elem.className === "vsr"
const isGradeHeadingElement = elem => elem.tagName === "H4"