const fs = require('fs').promises;

function capitalizeFirstCharacter(str) {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

async function loadContentTypes(contentTypesPaths, parser) {
  try {
    const blockTypes = {};
    const compositionTypes = {};
    const documentTypes = [];

    const detectedCompositionAliases = [];
    const nonDocumentTypes = [];

    for (const filePath of contentTypesPaths) {
      // Read the content of each file
      const data = await fs.readFile(filePath, 'utf8');
      const jObj = parser.parse(data);

      if (jObj.Empty) {
        continue;
      }

      try {
        const contentType = jObj.ContentType["@_Alias"];
        const isElement = jObj.ContentType.Info.IsElement;

        if (!isElement) {
          const propertiesInput = Array.isArray(jObj.ContentType.GenericProperties.GenericProperty)
            ? jObj.ContentType.GenericProperties.GenericProperty
            : [jObj.ContentType.GenericProperties.GenericProperty];

          const compositions = Array.isArray(jObj.ContentType.Info.Compositions.Composition)
            ? jObj.ContentType.Info.Compositions.Composition
            : jObj.ContentType.Info.Compositions.Composition ? [jObj.ContentType.Info.Compositions.Composition] : [];

          compositions.forEach(composition => {
            if (detectedCompositionAliases.includes(composition["#text"])) {
              return;
            } else {
              detectedCompositionAliases.push(composition["#text"]);
            }
          });

          documentTypes.push({
            contentType,
            compositions: compositions.map(composition => `${capitalizeFirstCharacter(composition["#text"])}Type`),
            properties: propertiesInput.map(property => {
              return {
                alias: property.Alias,
                definitionKey: property.Definition,
                mandatory: property.Mandatory,
                type: property.Type
              }
            }),
          });
        } else {
          nonDocumentTypes.push(jObj);
        }
      } catch (error) {
        console.log('Error parsing data', error, jObj);
      }
    }

    // go through all nondocument types
    for (const jObj of nonDocumentTypes) {
      const contentType = jObj.ContentType["@_Alias"];
      const key = jObj.ContentType["@_Key"];
      // console.log('parsing', contentType, key);

      const propertiesInput = Array.isArray(jObj.ContentType.GenericProperties.GenericProperty)
        ? jObj.ContentType.GenericProperties.GenericProperty
        : [jObj.ContentType.GenericProperties.GenericProperty];

      const compositions = Array.isArray(jObj.ContentType.Info.Compositions.Composition)
        ? jObj.ContentType.Info.Compositions.Composition
        : jObj.ContentType.Info.Compositions.Composition ? [jObj.ContentType.Info.Compositions.Composition] : [];


      compositions.forEach(composition => {
        if (detectedCompositionAliases.includes(composition["#text"])) {
          return;
        } else {
          detectedCompositionAliases.push(composition["#text"]);
        }
      });

      blockTypes[key] = {
        contentType,
        compositions: compositions.map(composition => `${capitalizeFirstCharacter(composition["#text"])}Type`),
        properties: propertiesInput.map(property => {
          return {
            alias: property.Alias,
            definitionKey: property.Definition,
            type: property.Type
          }
        }),
      };
    }

    detectedCompositionAliases.forEach(compositionAlias => {
      const compositionKey = Object.keys(blockTypes).find(key => blockTypes[key].contentType === compositionAlias);
      const composition = blockTypes[compositionKey];
      compositionTypes[compositionKey] = composition;
      delete blockTypes[compositionKey];
    });

    return { blockTypes, compositionTypes, documentTypes };
  } catch (err) {
    console.error('Error reading directory or files:', err);
  }
}

module.exports = { loadContentTypes };