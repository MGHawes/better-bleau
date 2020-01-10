import { countBy, flatMap, map, sortBy } from "lodash-es";
import { IRawClimb } from "./domInteraction";

export interface IClimb extends IRawClimb {
  gradeCategory: string;
  climbTypes: string[];
}
export const processRawClimbs = (rawClimbs: IRawClimb[]): IClimb[] => {
  const climbsWithGradeAndTypes = rawClimbs.map(
    (climb) => ({
      ...climb,
      gradeCategory: parseGradeText(climb.gradeText),
      climbTypes: parseClimbTypesString(climb.climbTypesString),
    }
  ));

  return climbsWithGradeAndTypes;
};

export const getTopNClimbTypes = (
    climbTypesByGrade: { [grade: string]: string[] },
    n: number,
  ): Array<[string, number]> => {
    const allClimbTypeCounts = countBy(flatMap(climbTypesByGrade));
    const topNClimbTypes = sortBy(
      map(allClimbTypeCounts, (v: number, k: string) => [k, v] as [string, number]),
      ([, v]) => -v,
    ).slice(0, n);

    return topNClimbTypes;
};

export const parseClimbTypesString = (typesString: string): string[] => 
  typesString.split(",").map(parseClimbType).filter(t => t.length > 0);

export const parseGradeText = (gradeText: string): string => {
  const grade = Number(gradeText.trim().slice(0, 1));
  if (isNaN(grade)) {
    return "Unknown";
  }
  if (grade < 5) {
    return "< 5";
  }
  return `${grade}s`;
};

const parseClimbType = (typeString: string): string => {
  const type = typeString.trim();
  if (type.search(/[Tt]raverse/) >= 0) {
    return "traverse";
  }
  return type;
};
