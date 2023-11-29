const fs = require('fs').promises;

const typewriter = async (typeBucket, outputPath) => {
  const types = Object.keys(typeBucket);
  const typeWriter = [];

  types.forEach(type => {
    const typeObject = typeBucket[type];
    const properties = writeNestedProperties(typeObject, 1);
    const intersects = typeObject.__intersects ? ` & ${typeObject.__intersects.join(' & ')}` : '';
    const union = typeObject.__union ? `${typeObject.__union.join(' | ')} ` : '';
    const typeString = `export type ${type} = ${union}${properties}${intersects}`;
    typeWriter.push(typeString);
  });

  const output = typeWriter.join('\n\n');
  await fs.writeFile(outputPath, output);
};

const writeNestedProperties = (obj, indentLevel) => {
  const spacing = '  '.repeat(indentLevel);
  const spacingEnd = '  '.repeat(indentLevel -1);
  const keys = Object.keys(obj);
  const output = [];
  const nullable = obj.__nullable || [];

  keys.forEach(key => {
    if (key === '__intersects' || key === "__union" || key === "__nullable") {
      return;
    }
    const propertyType = obj[key];
    const nulled = nullable.includes(key) ? ' | null' : '';
    const intersects = propertyType.__intersects && propertyType.__intersects.length ? ` & ${propertyType.__intersects.join(' & ')}` : '';
    const propertyValue = typeof propertyType === 'object' ? writeNestedProperties(propertyType, indentLevel + 1) : propertyType;
    output.push(`${spacing}${key}: ${propertyValue}${nulled}${typeof propertyType === 'object' ? '' : ';'}${intersects}`);
  });

  return output.length ? `{\n${output.join('\n')}\n${spacingEnd}}` : "";
};

module.exports = { typewriter };