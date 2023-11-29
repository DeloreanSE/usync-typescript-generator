const fs = require('fs').promises;

async function loadDataTypes(dataTypesPaths, parser) {
  try {
    const dataTypes = {};
    for (const filePath of dataTypesPaths) {

      // Read the content of each file
      const data = await fs.readFile(filePath, 'utf8');
      const jObj = parser.parse(data);

      if (jObj.Empty) {
        continue;
      }

      try {
        const key = jObj.DataType["@_Key"];
        const editorAlias = jObj.DataType.Info.EditorAlias;
        const config = jObj.DataType.Config ? JSON.parse(jObj.DataType.Config) : undefined;
        const childBlockKeys = Array.isArray(config?.Blocks) ? config.Blocks.map(block => block.contentElementTypeKey) : undefined;

        dataTypes[key] = {
          editorAlias,
          config,
          childBlockKeys
        };
      } catch (error) {
        console.log('Error parsing data type', error, jObj);
      }
    }
    return dataTypes;
  } catch (err) {
    console.error('Error reading directory or files:', err);
  }
}

module.exports = { loadDataTypes };