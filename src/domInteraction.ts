import { IClimb, processRawClimbs } from "./dataProcessing";

export const CHART_ID = "chart";
export interface IRawClimb {
  gradeText: string;
  climbTypesString: string;
  element: HTMLDivElement;
}
export const extractClimbsFromDom = (leftColumn: HTMLDivElement): IClimb[] => {
  const rawClimbs: IRawClimb[] = [];
  let gradeText: any;
  for (const element of leftColumn.children) {
      if (isGradeHeadingElement(element)) {
      gradeText = element.innerText.trim();
    } else if (isClimbContainerElement(element) && gradeText != null) {
      rawClimbs.push({ gradeText, climbTypesString: extractClimbTypesString(element), element });
    }
  }

  return processRawClimbs(rawClimbs);
};

export interface IGradeHeader {
  element: HTMLHeadingElement;
  gradeText: string;
}
export const extractGradeHeaderFromDom = (leftColumn) => {
  const gradeHeaders: IGradeHeader[] = [];
  for (const element of leftColumn.children) {
      if (isGradeHeadingElement(element)) {
        const gradeText = element.innerText.trim();
        gradeHeaders.push({ gradeText, element });
      }
  }
  return gradeHeaders;
};

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

let chartContainer;
export const createChartElement = (rightColumn: Element): HTMLElement => {
  if (!chartContainer) {
    chartContainer = document.createElement("div");
    chartContainer.className = "row";
    chartContainer.style.width = "100%";

    if (rightColumn.children.length < 2) {
      rightColumn.appendChild(chartContainer);
    } else {
      rightColumn.insertBefore(chartContainer, rightColumn.children[1]);
    }
  }

  const oldElement = document.getElementById(CHART_ID);
  if (oldElement) {
    oldElement.remove();
  }

  const chartElement = document.createElement("svg");
  chartElement.id = CHART_ID;
  chartElement.style.width = "100%";
  chartElement.style.height = "350px";
  chartElement.style.display = "block";
  chartContainer.appendChild(chartElement);

  return chartElement;
};

const isClimbContainerElement = (elem: Element): elem is HTMLDivElement =>
  elem.tagName === "DIV" && elem.className === "vsr";
const isGradeHeadingElement = (elem: Element): elem is HTMLHeadingElement  => elem.tagName === "H4";
