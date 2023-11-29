const chokidar = require('chokidar');
const { XMLParser } = require("fast-xml-parser");
const { typewriter } = require('./functions/typewriter');
const { loadAndSortConfigs } = require('./functions/loadAndSortConfigs');
const { getTypeBucket } = require("./functions/getUmbracoBaseTypes");
const commander = require('commander');

commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-u, --usyncPath <value>', 'The folder containing your uSync config files.', './uSync/v9')
  .option('-o, --output <value>', 'The filepath of the generated types file', './output/content-delivery-api-types.ts')
  .parse(process.argv);

const options = commander.opts();

const parser = new XMLParser({ ignoreAttributes: false });
const directoryPath = options.usyncPath;
const outputPath = options.output;

function capitalizeFirstCharacter(str) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

const typeBucket = getTypeBucket();

const parseProperties = (properties, dataTypes, blockTypes) => {
  const parsedProperties = {};
  const nullable = [];

  properties.forEach(property => {
    let type = {};
    const dataType = dataTypes[property.definitionKey];

    switch (property.type) {
      case 'Umbraco.DateTime':
      case 'Umbraco.TextArea':
      case 'Umbraco.TextBox':
      case 'Umbraco.DateTime':
      case 'Umbraco.Integer':
      case 'Umbraco.Decimal':
      case 'Umbraco.RadioButtonList':
      case 'Umbraco.DropDown.Flexible':
      case 'Umbraco.MultiNodeTreePicker':
      case 'Umbraco.MediaPicker3':
        if (!property.mandatory) {
          nullable.push(property.alias);
        }
        break;
      default:
        break;
    }
    switch (property.type) {
      case 'Umbraco.TinyMCE':
        type = 'RichTextElementType';
        break;
      case 'Umbraco.MultiUrlPicker':
        type = 'Array<MultiUrlPickerSingleUrlType>';
        break;
      case 'Umbraco.MultiNodeTreePicker':
        type = 'Array<DocumentType>';
        break;
      case 'Umbraco.DateTime':
      case 'Umbraco.TextArea':
      case 'Umbraco.TextBox':
        type = 'string';
        break;
      case 'Umbraco.Integer':
      case 'Umbraco.Decimal':
        type = 'number';
        break;
      case 'Umbraco.TrueFalse':
        type = 'boolean';
        break;
      case 'Umbraco.RadioButtonList':
        const radioChoices = dataType.config?.Items?.map(item => item.value);
        type = `"${radioChoices.join('" | "')}"`;
        break;
      case 'Umbraco.DropDown.Flexible':
        const dropdownChoices = dataType.config?.Items?.map(item => item.value);
        const isMultiple = dataType.config?.Multiple;
        // console.log(property, dataType);
        type = isMultiple ?
          `Array<"${dropdownChoices.join('" | "')}">`
          : `"${dropdownChoices.join('" | "')}"`;
        break;
      case 'Umbraco.BlockList':
        nullable.push(property.alias);
        const childBlocks = dataType.childBlockKeys.map(key => {
          const childBlock = blockTypes[key];

          return childBlock;
        });
        type = {
          items: `Array<${childBlocks.map(
            block => capitalizeFirstCharacter(block.contentType) + 'Type'
          ).join(' | ')}>`
        };
        break;
      case 'Umbraco.MediaPicker3':
        type = 'Array<PickedMediaType>';
        break;
      default:
        console.log('Unknown property type', property);
    }
    parsedProperties[property.alias] = type;


  });

  return {
    ...parsedProperties,
    __nullable: nullable
  };
};

const assignCompositionTypes = (compositionTypes, dataTypes, blockTypes) => {
  Object.keys(compositionTypes).forEach(compositionTypeKey => {
    const compositionType = compositionTypes[compositionTypeKey];
    const type = {
      properties: parseProperties(compositionType.properties, dataTypes, blockTypes)
    };

    typeBucket[`${capitalizeFirstCharacter(compositionType.contentType)}Type`] = type;
  });
}

const assignBlockTypes = (blockTypes, dataTypes) => {
  Object.keys(blockTypes).forEach(blockTypeKey => {
    const blockType = blockTypes[blockTypeKey];
    const type = {
      content: {
        contentType: `"${blockType.contentType}"`,
        id: "string",
        properties: {
          __intersects: blockType.compositions,
          ...parseProperties(blockType.properties, dataTypes, blockTypes)
        }
      },
      settings: "unknown" // not implemented, yet
    };

    typeBucket[`${capitalizeFirstCharacter(blockType.contentType)}Type`] = type;
  });
}

const assignDocumentTypes = (documentTypes, dataTypes, blockTypes) => {
  documentTypes.forEach(documentType => {
    const type = {
      __intersects: ["BaseDocumentType", ...documentType.compositions],
      contentType: `"${documentType.contentType}"`,
      properties: parseProperties(documentType.properties, dataTypes, blockTypes)
    };

    typeBucket[`${capitalizeFirstCharacter(documentType.contentType)}Type`] = type;
  });
}

const assignCombinedDocumentType = (documentTypes) => {
  const type = {
    __union: documentTypes.map(documentType => `${capitalizeFirstCharacter(documentType.contentType)}Type`),
  }

  typeBucket["DocumentType"] = type;
}

let isProcessing = false;

async function processAllFiles(directoryPath) {
  if (isProcessing) {
    console.warning('Already processing, skipping');
    return;
  }
  isProcessing = true;
  const { dataTypes, blockTypes, compositionTypes, documentTypes } = await loadAndSortConfigs(directoryPath, parser);

  assignCompositionTypes(compositionTypes, dataTypes, blockTypes);
  assignBlockTypes(blockTypes, dataTypes);
  assignDocumentTypes(documentTypes, dataTypes, blockTypes);
  assignCombinedDocumentType(documentTypes);

  await typewriter(typeBucket, outputPath);
  isProcessing = false;
}

let rebuildTimeout = null;

console.log(`Watching for file changes in folder ${directoryPath}`);
chokidar.watch(directoryPath, { ignoreInitial: true }).on('all', async (event, path) => {
  console.log(`Filechange detected, rebuilding types. Change: ${event} ${path}`)
  clearTimeout(rebuildTimeout);
  rebuildTimeout = setTimeout(() => {
    processAllFiles(directoryPath);
  }, 100);
});

processAllFiles(directoryPath);