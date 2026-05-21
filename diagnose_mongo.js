const fs = require('fs');
const MongoStore = require('connect-mongo');

let output = '';
output += `Type of export: ${typeof MongoStore}\n`;
output += `Keys: ${JSON.stringify(Object.keys(MongoStore))}\n`;

if (typeof MongoStore === 'function') {
    output += 'Export is a function (likely v3 style)\n';
}

if (MongoStore.create) {
    output += 'MongoStore.create exists (v4+ style)\n';
} else {
    output += 'MongoStore.create DOES NOT exist\n';
}

if (MongoStore.default) {
    output += 'MongoStore.default exists\n';
    if (MongoStore.default.create) {
        output += 'MongoStore.default.create exists\n';
    }
}

fs.writeFileSync('diagnosis.txt', output);
