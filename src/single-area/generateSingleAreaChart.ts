import { countBy, flatMap, forEach, groupBy, isEqual, mapValues, some, fromPairs } from "lodash-es";
import * as Plottable from "plottable";
import { initializeChart } from "./charting";
import { getTopNClimbTypes, IClimb, parseGradeText } from "./dataProcessing";
import {
  createChartElement,
  extractClimbsFromDom,
  extractGradeHeaderFromDom,
  getRightAndLeftColumns,
  IGradeHeader,
} from "./domInteraction";

const NUM_CLIMB_TYPES_TO_SHOW = 10;
export const GRADE_CATEGORIES = ["< 5", "5s", "6s", "7s", "8s"];

interface ISelection {
  gradeCategory?: string;
  climbType?: string;
}
export interface IState {
  selection: ISelection[];
}
export type IStateSetter = (newStateOrUpdater: IState | ((prevState: IState) => IState)) => void;
export function generateSingleAreaChart() {
  const [leftColumn, rightColumn] = getRightAndLeftColumns();
  const chartElement = createChartElement(rightColumn);

  const climbs = extractClimbsFromDom(leftColumn);
  const rawGradeHeaders = extractGradeHeaderFromDom(leftColumn);

  const chartData = getChartDatasets(climbs, NUM_CLIMB_TYPES_TO_SHOW);
  const chartDatasets = mapValues(chartData, (d) => new Plottable.Dataset(d));

  let onUpdateState: () => void | undefined;
  let state: IState = { selection: [] };
  const setState: IStateSetter = (newStateOrUpdater) => {
      const newState = typeof(newStateOrUpdater) === "function"
        ? newStateOrUpdater(state)
        : newStateOrUpdater;

      if (isEqual(state, newState)) {
      return;
    }
      state = newState;
      if (onUpdateState) {
        onUpdateState();
      }
  };

  onUpdateState = () => {
    updateChartDatasets(state, chartDatasets);
    updateVisibleClimbs(state, climbs, rawGradeHeaders);
  };

  initializeChart(chartElement, chartDatasets, setState);
}

const updateVisibleClimbs = (
  { selection }: IState,
  climbs: IClimb[],
  rawGradeHeaders: IGradeHeader[],
  ) => {
    const selectedGrades = new Set(selection.map((p) => p.gradeCategory).filter((g) => g != null));
    const selectedGradeTypePairs = new Set(
      selection.map(({ gradeCategory, climbType }) => [gradeCategory, climbType].toString()));

    const isClimbSelected = selectedGradeTypePairs.size === 0
      ? () => true
      : (climb: IClimb) => some(
        climb.climbTypes.map(
          (climbType) => testIsSelected([climb.gradeCategory, climbType], selectedGradeTypePairs),
        ));

    const isClimbHeaderSelected = selectedGrades.size === 0
      ? () => true
      : (header: IGradeHeader) => selectedGrades.has(parseGradeText(header.gradeText));

    climbs.forEach((climb) => climb.element.style.display = isClimbSelected(climb) ? "block" : "none");
    rawGradeHeaders.forEach((header) =>
      header.element.style.display = isClimbHeaderSelected(header) ? "block" : "none");
};

const updateChartDatasets = (
  { selection }: IState,
  chartDatasets: { [gradeCategory: string]: Plottable.Dataset },
  ) => {
    if (selection.length === 0) {
      forEach(chartDatasets, (dataset: Plottable.Dataset) => {
        const newData = dataset.data().map((d) => ({ ...d, isSelected: null }));
        dataset.data(newData);
      });
      return;
    }

    const selectedGradeTypePairs = new Set(
      selection.map(({ gradeCategory, climbType }) => [gradeCategory, climbType].toString()));

    forEach(chartDatasets, (dataset: Plottable.Dataset) => {
      const newData = dataset.data().map(
        (d) => ({ ...d, isSelected: testIsSelected([d.gradeCategory, d.climbType], selectedGradeTypePairs) }));

      dataset.data(newData);
    });
};

const testIsSelected = (gradeTypePair: [string, string], selectedGradeTypePairs: Set<string>) => {
  const [grade, type] = gradeTypePair;
  const isTypeSelected = selectedGradeTypePairs.has([null, type].toString());
  const isGradeSelected = selectedGradeTypePairs.has([grade, null].toString());
  const isPairSelected = selectedGradeTypePairs.has(gradeTypePair.toString());

  return isTypeSelected || isGradeSelected || isPairSelected;
};

interface IDataPoint {
  gradeCategory: string;
  climbType: string;
  count: number;
  isSelected: boolean | null;
}
interface IChartData {
  [gradeCategory: string]: IDataPoint[];
}
const getChartDatasets = (climbs: IClimb[], numClimbsTypesToShow: number): IChartData => {
  const climbsWithTypes = climbs.filter(c => c.climbTypes.length > 0)
  const climbTypesByGrade = mapValues(
    groupBy(climbsWithTypes, (c) => c.gradeCategory),
    (groupedClimbs: IClimb[]) => flatMap(groupedClimbs, (climb) => climb.climbTypes),
  );

  const topClimbTypes = getTopNClimbTypes(climbsWithTypes, numClimbsTypesToShow);

  const climbTypeCountsByGrade = mapValues(
    climbTypesByGrade,
    (climbTypes) => countBy(climbTypes),
  );

  const datasets = mapValues(
      climbTypeCountsByGrade,
      (countsByType, gradeCategory) => topClimbTypes.map(([climbType, _]) => ({
          climbType,
          gradeCategory,
          isSelected: null,
          count: climbType.toString() in countsByType ? countsByType[climbType] : 0,
        })),
  );

  return fromPairs(GRADE_CATEGORIES.map(gradeCategory => [gradeCategory, datasets[gradeCategory] || []]));
};
