
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

export const createChartElement = (rightColumn: Element): HTMLDivElement => {
  const chartElement = document.createElement("div");
  chartElement.className = "row";
  chartElement.style.width = "100%";
  if (rightColumn.children.length < 2) {
    rightColumn.appendChild(chartElement);
  } else {
    rightColumn.insertBefore(chartElement, rightColumn.children[1]);
  }

  return chartElement;
};

const isClimbContainerElement = (elem: Element): elem is HTMLDivElement =>
  elem.tagName === "DIV" && elem.className === "vsr";
const isGradeHeadingElement = (elem: Element): elem is HTMLHeadingElement  => elem.tagName === "H4";
