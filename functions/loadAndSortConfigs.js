const { getFilePathsInDirectory } = require('./getFilePathsInDirectory');
const { loadContentTypes } = require('./loadContentTypes');
const { loadDataTypes } = require('./loadDataTypes');

const loadAndSortConfigs = async (directoryPath, parser) => {
  const dataTypesPaths = await getFilePathsInDirectory(`${directoryPath}/DataTypes`);
  const dataTypes = await loadDataTypes(dataTypesPaths, parser);

  const contentTypesPaths = await getFilePathsInDirectory(`${directoryPath}/ContentTypes`);
  const { blockTypes, compositionTypes, documentTypes } = await loadContentTypes(contentTypesPaths, parser);
  // console.log('------------------- BLOCK TYPES')
  // console.log(JSON.stringify(blockTypes, null, 4));
  // console.log('------------------- COMPOSITION TYPES')
  // console.log(JSON.stringify(compositionTypes, null, 4));
  // console.log('------------------- DOCUMENT TYPES')
  // console.log(JSON.stringify(documentTypes, null, 4));
  // console.log('------------------- DATA TYPES')
  // console.log(JSON.stringify(dataTypes, null, 4));
  return { dataTypes, blockTypes, compositionTypes, documentTypes };
};

module.exports = { loadAndSortConfigs };