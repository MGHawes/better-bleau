import { forEach, keys, reverse, isEqual } from "lodash-es";
import * as Plottable from "plottable";
import { IState, IStateSetter, GRADE_CATEGORIES } from "./generateSingleAreaChart";

export const initializeChart = (
  chartElement: HTMLElement,
  datasets: { [gradeCategory: string]: Plottable.Dataset },
  setState: IStateSetter,
  ) => {
    const xScale = new Plottable.Scales.Linear();
    const yScale = new Plottable.Scales.Category();
    const yAxis = new Plottable.Axes.Category(yScale, "left");
    const colorScale = new Plottable.Scales.Color();

    colorScale.domain(GRADE_CATEGORIES);
    colorScale.range(["#87c293", "#a0d31c", "#ffd212", "#ffb745", "#ff8972"]);

    const plot = new Plottable.Plots.StackedBar("horizontal");
    forEach(GRADE_CATEGORIES, (gradeCategory) => plot.addDataset(datasets[gradeCategory]));

    plot
      .x((d) => d.count, xScale)
      .y((d) => d.climbType, yScale)
      .labelsEnabled(true)
      .attr("fill", ({ gradeCategory }) => gradeCategory, colorScale)
      .attr("opacity", ({ isSelected }) => isSelected === true || isSelected === null ? 1 : 0.5)
      .attr("stroke", ({ isSelected }) => isSelected === true ? "#6d6d6d" : "none");

    const legend = new Plottable.Components.Legend(colorScale).maxEntriesPerRow(Infinity);
    const table = new Plottable.Components.Table([
      [null, legend],
      [yAxis,  plot],
    ]);

    registerInteractions({ plot, yAxis, legend }, setState);

    table.renderTo(chartElement);

    window.addEventListener("resize", () => {
      plot.redraw();
    });
};

const registerInteractions = (
  { plot, yAxis, legend }: {
    plot: Plottable.Plots.Bar<any, any>,
    yAxis: Plottable.Axis<string>,
    legend: Plottable.Components.Legend,
  },
  setState: IStateSetter,
  ) => {
    const plotClickInteraction = new Plottable.Interactions.Click();
    plotClickInteraction.onClick((point) => {
      const clickedEntities = plot.entitiesAt(point);

      if (clickedEntities.length === 0) {
        setState({ selection: [] });
        return;
      }
      const { climbType, gradeCategory } = plot.entitiesAt(point)[0].datum;
      setState((prevState: IState) => ({ selection: [...prevState.selection, { gradeCategory, climbType }] }));
    });
    plotClickInteraction.attachTo(plot);

    const axisClickInteraction = new Plottable.Interactions.Click();
    axisClickInteraction.onClick((_, event) => {
      const clickedLabel = yAxis.tickLabelDataOnElement(event.target as Element);

      if (clickedLabel != null && typeof(clickedLabel) === "string") {
        setState((prevState: IState) => ({ selection: [...prevState.selection, { climbType: clickedLabel }] }));
      }
    });
    axisClickInteraction.attachTo(yAxis);

    const legendClickInteraction = new Plottable.Interactions.Click();
    legendClickInteraction.onClick((point) => {
      const clickedEntities = legend.entitiesAt(point);

      if (clickedEntities.length > 0) {
        setState((prevState: IState) =>
          ({ selection: [...prevState.selection, { gradeCategory: clickedEntities[0].datum }] }));
      }
    });
    legendClickInteraction.attachTo(legend);
};
