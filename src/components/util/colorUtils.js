// -- colors --
// #fbb4ae - Red
// #b3cde3 - Blue
// #ccebc5 - Green
// #decbe4 - Purple
// #fed9a6 - Orange
// #ffffcc - Yellow
// #e5d8bd - Brown
// #fddaec - Pink
// #f2f2f2 - Silver
// #b3de69 - Darker green
const undefinedColor = '#cccccc';
const colors = [
  '#fbb4ae',
  '#b3cde3',
  '#ccebc5',
  '#decbe4', // purple
  '#fed9a6', // orange
  '#ffffcc',
  '#e5d8bd',
  '#b3de69',
  '#fddaec',
  '#fccde5', // Light grayish pink'
  '#f2f2f2', // Silver, extra?
];
const concepts = [
  'anatomical_entity',
  'biological_process',
  'cell',
  'chemical_substance',
  'disease',
  'gene',
  'genetic_condition',
  'molecular_function',
  'pathway',
  'phenotypic_feature',
];

export default function getNodeTypeColorMap(types = concepts) {
  return type => colors[types.slice().sort().indexOf(type)];
}
