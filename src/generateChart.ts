import { countBy, flatMap, groupBy, mapValues, some } from "lodash";
import { forEach, isEqual, keys, reverse } from "lodash-es";
import * as Plottable from "plottable";
import { getTopNClimbTypes, IClimb, parseGradeText } from "./dataProcessing";
import {
  createChartElement,
  extractClimbsFromDom,
  extractGradeHeaderFromDom,
  getRightAndLeftColumns,
  IGradeHeader,
} from "./domInteraction";

const NUM_CLIMB_TYPES_TO_SHOW = 10;

interface IState {
  selection: ISelectedBar[];
}
type IStateSetter = (newStateOrUpdater: IState | ((prevState: IState) => IState)) => void;
export function generateChart() {
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
    const selectedGrades = new Set(selection.map((p) => p.gradeCategory));
    const selectedGradeTypePairs = new Set(
      selection.map(({ gradeCategory, climbType }) => [gradeCategory, climbType].toString()));

    const isClimbSelected = selectedGradeTypePairs.size === 0
      ? () => true
      : (climb: IClimb) => some(
        climb.climbTypes.map(
          (climbType) => selectedGradeTypePairs.has([climb.gradeCategory, climbType].toString()),
        ));

    const isClimbHeaderSelected = selectedGradeTypePairs.size === 0
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
        const newData = dataset.data().map((d) => ({ ...d, isSelected: true }));
        dataset.data(newData);
      });
      return;
    }

    const selectedGradeTypePairs = new Set(
      selection.map(({ gradeCategory, climbType }) => [gradeCategory, climbType].toString()));

    forEach(chartDatasets, (dataset: Plottable.Dataset) => {
      const newData = dataset.data().map(
        (d) => ({ ...d, isSelected: selectedGradeTypePairs.has([d.gradeCategory, d.climbType].toString()) }));

      dataset.data(newData);
    });
};

interface IDataPoint {
  gradeCategory: string;
  climbType: string;
  count: number;
  isSelected: boolean;
}
interface ISelectedBar {
  gradeCategory: string;
  climbType: string;
}
const initializeChart = (
  chartElement: HTMLElement,
  datasets: { [gradeCategory: string]: Plottable.Dataset },
  setState: IStateSetter,
  ) => {

    const xScale = new Plottable.Scales.Linear();
    const xAxis = new Plottable.Axes.Numeric(xScale, "bottom");
    const yScale = new Plottable.Scales.Category();
    const yAxis = new Plottable.Axes.Category(yScale, "left");
    const colorScale = new Plottable.Scales.Color();
    const sortedGradeCategories = reverse(keys(datasets)); // Alphabetical is sufficient
    colorScale.domain(sortedGradeCategories);
    colorScale.range(["#87c293", "#a0d31c", "#ffd212", "#ffb745", "#ff8972"]);

    const plot = new Plottable.Plots.StackedBar("horizontal");
    forEach(sortedGradeCategories, (gradeCategory) => plot.addDataset(datasets[gradeCategory]));

    plot
      .x((d) => d.count, xScale)
      .y((d) => d.climbType, yScale)
      .labelsEnabled(true)
      .attr("fill", ({ gradeCategory }) => gradeCategory, colorScale)
      .attr("opacity", ({ isSelected }) => isSelected ? 1 : 0.5);

    const clickInteraction = new Plottable.Interactions.Click();
    clickInteraction.onClick((point) => {
      const clickedEntities = plot.entitiesAt(point);

      if (clickedEntities.length === 0) {
        setState({ selection: [] });
        return;
      }
      const { climbType, gradeCategory } = plot.entitiesAt(point)[0].datum;
      setState((prevState: IState) => ({ selection: [...prevState.selection, { gradeCategory, climbType }] }));
    });
    clickInteraction.attachTo(plot);

    const legend = new Plottable.Components.Legend(colorScale).maxEntriesPerRow(Infinity);
    const table = new Plottable.Components.Table([
      [null, legend],
      [yAxis,  plot],
      [null, xAxis],
    ]);

    table.renderTo(chartElement);

    window.addEventListener("resize", () => {
      plot.redraw();
    });
};

interface IChartData {
  [gradeCategory: string]: IDataPoint[];
}
const getChartDatasets = (climbs: IClimb[], numClimbsTypesToShow: number): IChartData => {
  const climbTypesByGrade = mapValues(
    groupBy(climbs, (c) => c.gradeCategory),
    (groupedClimbs: IClimb[]) => flatMap(groupedClimbs, (climb) => climb.climbTypes),
  );

  const topClimbTypes = getTopNClimbTypes(climbTypesByGrade, numClimbsTypesToShow);

  const climbTypeCountsByGrade = mapValues(
    climbTypesByGrade,
    (climbTypes) => countBy(climbTypes),
  );

  const datasets = mapValues(
      climbTypeCountsByGrade,
      (countsByType, gradeCategory) => topClimbTypes.map(([climbType, _]) => ({
          climbType,
          gradeCategory,
          isSelected: true,
          count: climbType.toString() in countsByType ? countsByType[climbType] : 0,
        })),
  );

  return datasets;
};
