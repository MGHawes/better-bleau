export const CHART_ID = "chart"
export interface IRawClimb {
  gradeText: string;
  climbTypesString: string;
  element: HTMLDivElement;
}
export const extractClimbsFromDom = (leftColumn: HTMLDivElement): IRawClimb[] => {
  const climbs: IRawClimb[] = [];
  let gradeText: any;
  for (const element of leftColumn.children) {
      if (isGradeHeadingElement(element)) {
      gradeText = element.innerText.trim();
    } else if (isClimbContainerElement(element) && gradeText != null) {
      climbs.push({ gradeText, climbTypesString: extractClimbTypesString(element), element });
    }
  }
  return climbs;
};

export interface IGradeHeader {
  element: HTMLHeadingElement;
  gradeText: string;
}
export const extractGradeHeaderFromDom = leftColumn => {
  const gradeHeaders: IGradeHeader[] = [];
  for (const element of leftColumn.children) {
      if (isGradeHeadingElement(element)) {
        const gradeText = element.innerText.trim();
        gradeHeaders.push({ gradeText, element });
      }
  }
  return gradeHeaders;
}

const extractClimbTypesString = (elem: Element): string => {
  const typesElem = elem.querySelector<HTMLParagraphElement>(".btype");
  if (typesElem == null) {
    return "";
  }
  return typesElem.innerText;
};

export const getRightAndLeftColumns = (): [HTMLDivElement, HTMLDivElement] => {
  const mainContent = document.querySelector<HTMLDivElement>("main div.container");
  if (mainContent == null) {
    throw new Error("Couldn't find main container element");
  }
  const rightColumn = mainContent.querySelector<HTMLDivElement>(".pull-right");
  const leftColumn = mainContent.querySelector<HTMLDivElement>(":not(.pull-right).col-md-6");
  if (rightColumn == null || leftColumn == null) {
    throw new Error("Couldn't find left right columns");
  }

  return [leftColumn, rightColumn];
};

interface IChartContainer { 
  chartContainerElement: HTMLDivElement;
  resetSelectionButton: HTMLDivElement;
}
export const createChartContainer = (rightColumn: Element): IChartContainer => {
  const chartContainer = document.createElement("div");
  chartContainer.className = "row";
  chartContainer.style.width = "100%";

  const resetSelectionButton = document.createElement("div");
  // ToDo use css for these
  resetSelectionButton.style.width = "100%";
  resetSelectionButton.innerText = "Clear selection"
  resetSelectionButton.style.textAlign = "right"
  resetSelectionButton.style.color = "#777777"
  resetSelectionButton.style.zIndex = "10"
  resetSelectionButton.style.position = "relative"
  resetSelectionButton.style.cursor = "pointer"
  chartContainer.appendChild(resetSelectionButton);

  if (rightColumn.children.length < 2) {
    rightColumn.appendChild(chartContainer);
  } else {
    rightColumn.insertBefore(chartContainer, rightColumn.children[1]);
  }

  return { chartContainerElement: chartContainer, resetSelectionButton };
};

export const createChartElement = (chartContainerElement: HTMLDivElement) => {
  const chartElement = document.createElement("div");
  chartElement.style.width = "100%";
  chartElement.style.marginTop = "-30px"
  chartElement.style.position = "relative"
  chartContainerElement.appendChild(chartElement);
  
  return chartElement;
}

const isClimbContainerElement = (elem: Element): elem is HTMLDivElement =>
  elem.tagName === "DIV" && elem.className === "vsr";
const isGradeHeadingElement = (elem: Element): elem is HTMLHeadingElement  => elem.tagName === "H4";
