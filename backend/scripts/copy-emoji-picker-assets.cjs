const fs = require('node:fs');
const path = require('node:path');

const backendDirectory = path.resolve(__dirname, '..');
const projectDirectory = path.resolve(backendDirectory, '..');
const pickerSource = path.join(backendDirectory, 'node_modules', 'emoji-picker-element');
const dataSource = path.join(backendDirectory, 'node_modules', 'emoji-picker-element-data');
const outputDirectory = path.join(projectDirectory, 'emoji-picker');

fs.mkdirSync(path.join(outputDirectory, 'vendor'), { recursive: true });
fs.mkdirSync(path.join(outputDirectory, 'i18n'), { recursive: true });

for (const file of ['index.js', 'picker.js', 'database.js']) {
    fs.copyFileSync(path.join(pickerSource, file), path.join(outputDirectory, 'vendor', file));
}

fs.copyFileSync(
    path.join(pickerSource, 'i18n', 'pt_BR.js'),
    path.join(outputDirectory, 'i18n', 'pt_BR.js'),
);
fs.copyFileSync(
    path.join(pickerSource, 'LICENSE'),
    path.join(outputDirectory, 'vendor', 'LICENSE'),
);
fs.copyFileSync(
    path.join(dataSource, 'pt', 'cldr', 'data.json'),
    path.join(outputDirectory, 'pt-emojibase-data.json'),
);
fs.copyFileSync(
    path.join(dataSource, 'LICENSE'),
    path.join(outputDirectory, 'DATA-LICENSE'),
);
