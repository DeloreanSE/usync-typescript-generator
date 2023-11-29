const fs = require('fs').promises;
const path = require('path');

async function getFilePathsInDirectory(directoryPath) {
  try {
    // Read the directory
    const files = await fs.readdir(directoryPath);
    const paths = [];

    // Iterate through the files in the directory
    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      // Check if it's a directory
      const isDirectory = (await fs.stat(filePath)).isDirectory();

      if (isDirectory) {
        // Recursively read files in subdirectory
        const subPaths = await getFilePathsInDirectory(filePath);
        paths.push(...subPaths);
      } else {
        paths.push(filePath);
        
      }
    }

    return paths;
  } catch (err) {
    console.error('Error reading directory or files:', err);
  }
}

module.exports = { getFilePathsInDirectory };