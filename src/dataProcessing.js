import { flatMap, countBy, map, sortBy, mapValues, groupBy } from 'lodash';

export const getTopNClimbTypes = (climbTypesByGrade, n) => {
  const allClimbTypeCounts = countBy(flatMap(climbTypesByGrade))
  const topNClimbTypes = sortBy(
    map(allClimbTypeCounts, (v, k) => [k, v]),
    ([k, v]) => -v, 
  ).slice(0, n)

  return topNClimbTypes;
}

export const parseClimbTypesString = typesString => typesString.split(",").map(parseClimbType)

export const parseGradeText = gradeText => {
  const grade = Number(gradeText.trim().slice(0, 1))
  if (isNaN(grade)) {
    return "Unknown"
  }
  if (grade < 5) {
    return "< 5"
  }
  return `${grade}s`
}

const parseClimbType = typeString => {
  const type = typeString.trim()
  if (type.search(/[Tt]raverse/) != -1) {
    return "traverse"
  }
  return type
}