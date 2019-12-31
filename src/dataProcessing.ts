import { flatMap, countBy, map, sortBy } from 'lodash';
import { RawClimb } from "./domInteraction";

export const getTopNClimbTypes = (
    climbTypesByGrade: { [grade: string]: string[] },
    n: number
  ): [string, number][] => {
    const allClimbTypeCounts = countBy(flatMap(climbTypesByGrade))
    const topNClimbTypes = sortBy(
      map(allClimbTypeCounts, (v: number, k: string) => [k, v] as [string, number]),
      ([, v]) => -v, 
    ).slice(0, n)

    return topNClimbTypes;
}

export const parseClimbTypesString = (typesString: string): string[] => typesString.split(",").map(parseClimbType)

export const parseGradeText = (gradeText: string): string => {
  const grade = Number(gradeText.trim().slice(0, 1))
  if (isNaN(grade)) {
    return "Unknown"
  }
  if (grade < 5) {
    return "< 5"
  }
  return `${grade}s`
}

const parseClimbType = (typeString: string): string => {
  const type = typeString.trim()
  if (type.search(/[Tt]raverse/) != -1) {
    return "traverse"
  }
  return type
}