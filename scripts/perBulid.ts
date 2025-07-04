import 'path';
import fs from 'fs';
import path from 'path';
import { transformJsoncToJSON } from './generateTragedysSchema';
import { validateScript } from './validation'
import { Keyword } from './keywords.g';
import { Character } from './characters.g'
import { Incident } from './incidents.g'
import { Plot } from './plots.g'
import { Role } from './roles.g'
import { Script } from './scripts.g'
import { Tag } from './tags.g'
import { Tragedy } from './tragedys.g'
import { exit } from 'process';


const types = ['keywords', 'characters', 'plots', 'roles', 'tragedys', 'incidents', 'scripts', 'tags'] as const;
const schemaTypes = [...types, 'translations', 'translationOverrides'] as const;

type getJsonObjectsWithSchemaResult<T> = T extends 'translations'
    ? Record<string, Record<string, string>>
    : T extends 'keywords'
    ? Keyword[]
    : T extends 'characters'
    ? Character[]
    : T extends 'plots'
    ? Plot[]
    : T extends 'roles'
    ? Role[]
    : T extends 'tragedys'
    ? Tragedy[]
    : T extends 'incidents'
    ? Incident[]
    : T extends 'scripts'
    ? Script[]
    : T extends 'tags'
    ? Tag[]
    : Object[]


function getJsonObjectsWithSchemaWithoutSubfolder<T extends typeof schemaTypes[number]>(dir: string, type: T): getJsonObjectsWithSchemaResult<T>[] {
    const files = fs.readdirSync(dir);
    const jsonObjects: getJsonObjectsWithSchemaResult<T>[] = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
        } else if (file.endsWith('.json') || file.endsWith('.jsonc')) {
            const data = fs.readFileSync(filePath, 'utf-8');
            try {
                const parsedData = JSON.parse(transformJsoncToJSON(data));
                if (parsedData.$schema && parsedData.$schema.includes(`${type}.schema.json`) && parsedData[type]) {
                    jsonObjects.push(parsedData[type]);
                }
            } catch (error) {
                console.error(`Error parsing JSON in ${filePath}:`, error);
            }
        }
    }
    return jsonObjects;
}

function getJsonObjectsWithSchema<T extends typeof schemaTypes[number]>(dir: string, type: T): getJsonObjectsWithSchemaResult<T>[] {
    const files = fs.readdirSync(dir);
    const jsonObjects: getJsonObjectsWithSchemaResult<T>[] = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            jsonObjects.push(...getJsonObjectsWithSchema(filePath, type));
        } else if (file.endsWith('.json') || file.endsWith('.jsonc')) {
            const data = fs.readFileSync(filePath, 'utf-8');
            try {
                const parsedData = JSON.parse(transformJsoncToJSON(data));
                if (parsedData.$schema && parsedData.$schema.includes(`${type}.schema.json`) && parsedData[type]) {
                    jsonObjects.push(parsedData[type]);
                }
            } catch (error) {
                console.error(`Error parsing JSON in ${filePath}:`, error);
            }
        }
    }
    return jsonObjects;
}

function getTypescriptStrings<T extends typeof types[number]>(type: T) {
    const data = getJsonObjectsWithSchema('./data', type);
    const filteredFiles = data.map((x) => {
        if (type == 'scripts') {
            const scripts = x as unknown[];
            const validScripts = scripts
                .map((script) => {
                    const validatedScript = validateScript(script);
                    if (!validatedScript.valid) {
                        console.error(`Invalid script found in:\(${JSON.stringify(script, undefined, 2)}:\n`, JSON.stringify(validatedScript.errors, undefined, 2));
                    }
                    return validatedScript;
                })
                .filter(x => x.valid)
                .map(x => x.script);
            return JSON.stringify(validScripts, undefined, 2);
        }

        return JSON.stringify(x, undefined, 2);
    });

    return `
export const ${type} = [\n${filteredFiles.map(x => ` ...${x}`).reduce((p, c) => `${p}${p.length > 0 ? ',' : ''}\n${c}`, '')}\n] as const;
    ` + (type !== 'scripts' ? `export const ${type}Lookup = ${type}.reduce((p, c) => {
        if (typeof c === 'object' && c !== null && 'id' in c) {
            p[c.id] = c;
        }
        return p;
    }, {} as Record<typeof ${type}[number]['id'], ReadonlyRecursive<${type[0].toUpperCase()}${type.substring(1, type.length - 1)}>>);
    
    export function is${type[0].toUpperCase()}${type.substring(1, type.length - 1)}Id(id: unknown): id is keyof typeof ${type}Lookup {
        return typeof id === 'string' && id in ${type}Lookup;
    }
    
    ` : '');
}

const premableTypes =
    types.map(type => `import type { ${type[0].toUpperCase()}${type.substring(1, type.length - 1)} } from './${type}.g';\n`).reduce((p, c) => `${p}\n${c}`, '')
    + `

type ReadonlyRecursive<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
  ? ReadonlyArray<ReadonlyRecursive<U>>
  : T[P] extends string
  ? T[P]
  : T[P] extends number
  ? T[P]
  : T[P] extends null
  ? null
  : T[P] extends undefined
  ? undefined
  : ReadonlyRecursive<T[P]>
  ;
};

`
    ;

fs.writeFileSync('./src/data.ts', premableTypes + types.map(getTypescriptStrings).reduce((p, c) => `${p};\n\n${c}`, ''));
console.log('finished game data typescript generation');

// translations



function getAllStrings(obj: unknown): string[] {
    if (typeof obj === 'string') {
        return obj.split('|').map(s => s.trim()).filter(s => s.length > 0);
    } else if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            return obj.flatMap(getAllStrings);
        } else {
            return [...Object.values(obj).flatMap(getAllStrings), ...Object.keys(obj).flatMap(getAllStrings)];
        }
    }
    return [];
}

function writeSchema(translationStrings: string[], location: string) {
    if (translationStrings.length === 0) {
        return;
    }
    const translationSchema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Translations",
        type: "object",
        "additionalProperties": false,
        properties: {
            "$schema": {
                type: "string"
            },
            translations: {
                type: "object",
                "additionalProperties": {
                    "$ref": "#/definitions/laguages",
                },
            },
        },
        description: "Translations for the Tragedy Looper game. Each key is a language code, and the value is an object with translation keys and their corresponding translations.",
        "definitions": {
            "laguages": {
                type: "object",
                "additionalProperties": {
                    type: "string",
                },
                "propertyNames": {
                    "enum": [...new Set(translationStrings)]
                },
            },

        }
    };
    fs.writeFileSync(path.join(location, 'translations.schema.json'), JSON.stringify(translationSchema, undefined, 2));
    console.debug(`Finished writing translation schema to ${path.join(location, 'translations.schema.json')}`);
}
function writeOverrideSchema(translationStrings: string[], location: string) {
    if (translationStrings.length === 0) {
        return;
    }
    const translationSchema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "TranslationOverrides",
        type: "object",
        "additionalProperties": false,
        properties: {
            "$schema": {
                type: "string"
            },
            translationOverrides: {
                type: "object",
                "additionalProperties": {
                    "$ref": "#/definitions/laguages",
                },
            },
        },
        description: "Translations for the Tragedy Looper game. Each key is a language code, and the value is an object with translation keys and their corresponding translations.",
        "definitions": {
            "laguages": {
                type: "object",
                "additionalProperties": {
                    type: "array",
                    items: { tyep: "string" }
                },
                "propertyNames": {
                    "enum": [...new Set(translationStrings)]
                },
            },

        }
    };
    fs.writeFileSync(path.join(location, 'translationOverrides.schema.json'), JSON.stringify(translationSchema, undefined, 2));
    console.debug(`Finished writing translationOveride schema to ${path.join(location, 'translationOverrides.schema.json')}`);
}

// first we make the jsons cshemas for each data folder,

function generateTranslationSchemaForDataFolder(dir: string) {
    const nonScriptObjects = types.filter(x => x !== 'scripts').flatMap(type => getJsonObjectsWithSchema(dir, type));
    const scriptObjects = getJsonObjectsWithSchemaWithoutSubfolder(dir, 'scripts');
    const nonScriptStrings = getAllStrings(nonScriptObjects);
    const scriptStrings = scriptObjects.flat().flatMap(script => [
        `${script.title}.${script.creator ?? 'Unknown'}.description`,
        `${script.title}.${script.creator ?? 'Unknown'}.title`,
        `${script.title}.${script.creator ?? 'Unknown'}.mastermindHints`,
        `${script.title}.${script.creator ?? 'Unknown'}.specialRules`,
        `${script.title}.${script.creator ?? 'Unknown'}.story`,
        `${script.title}.${script.creator ?? 'Unknown'}.victory-conditions`
    ]);

    const uniqueStrings = [...new Set([...nonScriptStrings, ...scriptStrings].map(x => x.trim()).filter(x => x.length > 0))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

    writeSchema(uniqueStrings, dir);
    console.debug(`Finished generating translation schema for ${dir}`);
}

function generateTranslationOverrideSchemaForDataFolder(dir: string) {
    const nonScriptObjects = types.filter(x => x !== 'scripts').flatMap(type => getJsonObjectsWithSchema(dir, type));
    const scriptObjects = getJsonObjectsWithSchemaWithoutSubfolder(dir, 'scripts');
    const nonScriptStrings = nonScriptObjects.flat().flatMap(obj => [`${obj.id}.name`]);

    const uniqueStrings = [...new Set([...nonScriptStrings,].map(x => x.trim()).filter(x => x.length > 0))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

    writeOverrideSchema(uniqueStrings, dir);
    console.debug(`Finished generating translation schema for ${dir}`);
}



// generate translation schema for each folder under data
function getSubFolders(dir: string): string[] {
    const subFolders: string[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            subFolders.push(filePath);
            subFolders.push(...getSubFolders(filePath));
        }
    }
    return subFolders;
}
const dataFolders = getSubFolders('./data');
dataFolders.forEach(generateTranslationSchemaForDataFolder);
dataFolders.forEach(generateTranslationOverrideSchemaForDataFolder);
console.log('Finished generating translation schemas for data folders');



// now we generate the top translation schema, that contains all translations from the data without the scripts And the static translations from code.

function getTranslationStringsFromSrcInFolder(dir: string): string[] {
    const regex = /((getString(ForLanguage)?\()|(translationKey=\{?))(\s|\n)*(?<quote>['"])(?<text>.*?[^\\])\k<quote>/sg;
    const files = fs.readdirSync(dir);
    const translationStrings: string[] = [];
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            translationStrings.push(...getTranslationStringsFromSrcInFolder(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.svelte')) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            let match: RegExpExecArray | null;
            while ((match = regex.exec(fileContent)) !== null) {
                const quotes = match.groups?.quote ?? '"';
                const text = quotes === '"' ?
                    match.groups?.text.replaceAll('\"', '"') ?? ''
                    : match.groups?.text.replaceAll("\'", "'") ?? '';
                translationStrings.push(text.trim());
            }
        }
    }
    return translationStrings;
}

const srcTranslationStrings = getTranslationStringsFromSrcInFolder('./src');

const nonScriptObjects = types.filter(x => x !== 'scripts').flatMap(type => getJsonObjectsWithSchema('./data', type));
const nonScriptStrings = getAllStrings(nonScriptObjects);
const uniqueStrings = [...new Set([...nonScriptStrings, ...srcTranslationStrings].map(x => x.trim()).filter(x => x.length > 0))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

const targetSchemaLocations = ['./static', './translations'];
targetSchemaLocations.forEach(location => writeSchema(uniqueStrings, location));

function quoteString(text: string) {
    return `"${text.replaceAll('"', '\\"')}"`
}



const translationObject = `export const ui_strings = [\n${uniqueStrings.map(quoteString).reduce((p, c) => `${p}${p.length == 0 ? '' : ','}\n${c}`, "")}\n] as const;`;
fs.writeFileSync('./src/data-ui-strings.ts', translationObject);


// write the typescript translationDictionaly:

//since we have spectal handling for script files we first get all scripts

// const scriptReplacement = Object.fromEntries(getJsonObjectsWithSchema('./data', 'scripts').flat().flatMap(script => {
//     return ([
//         [`${script.title}.${script.creator ?? 'Unknown'}.description`, script.description ?? ''],
//         [`${script.title}.${script.creator ?? 'Unknown'}.title`, script.title ?? ''],
//         [`${script.title}.${script.creator ?? 'Unknown'}.mastermindHints`, script.mastermindHints ?? ''],
//         [`${script.title}.${script.creator ?? 'Unknown'}.specialRules`, script.specialRules?.join('\n\n') ?? ''],
//         [`${script.title}.${script.creator ?? 'Unknown'}.story`, script.story ?? ''],
//         [`${script.title}.${script.creator ?? 'Unknown'}.victory-conditions`, script['victory-conditions'] ?? '']
//     ] as const)
// }));

const replaceMents = Object.fromEntries(types.map((type) => {

    const entryes =
        type == 'scripts' ? Object.fromEntries(getJsonObjectsWithSchema('./data', type).flat().flatMap(script => {
            return ([
                [`${script.title}.${script.creator ?? 'Unknown'}.description`, script.description ?? ''],
                [`${script.title}.${script.creator ?? 'Unknown'}.title`, script.title ?? ''],
                [`${script.title}.${script.creator ?? 'Unknown'}.mastermindHints`, script.mastermindHints ?? ''],
                [`${script.title}.${script.creator ?? 'Unknown'}.specialRules`, script.specialRules?.join('\n\n') ?? ''],
                [`${script.title}.${script.creator ?? 'Unknown'}.story`, script.story ?? ''],
                [`${script.title}.${script.creator ?? 'Unknown'}.victory-conditions`, script['victory-conditions'] ?? '']
            ] as const);
        }))

            : Object.fromEntries(getJsonObjectsWithSchema('./data', type).flat().flatMap(element => {
                return ([
                    [`${element.id}.name`, element.name ?? ''],
                ] as const);
            }));

    return [type, entryes] as const;
})) as Record<typeof types[number], Record<string, string>>

const allTranslations = getJsonObjectsWithSchema('.', 'translations');

// merge languages
const mergedTranslations = allTranslations.reduce((acc, curr) => {
    Object.entries(curr).forEach(([lang, data]) => {
        if (!acc[lang]) {
            acc[lang] = {};
        }
        Object.entries(data).forEach(([key, value]) => {
            if (key in replaceMents.scripts) {
                key = replaceMents.scripts[key];
            }
            key = key.trim();
            if (!acc[lang][key]) {
                acc[lang][key] = value;
            } else {

                console.warn(`Duplicate key "${key}" found in language "${lang}". Keeping existing value.`, acc[lang][key], value);
            }
        });
    });
    return acc;
}, {} as Record<string, Record<string, string>>);

function generateOverrideUi() {
    const rawOverrides = getJsonObjectsWithSchema('./data', 'translationOverrides');
    const overrideData = rawOverrides.reduce((acc, curr) => {
        Object.entries(curr).forEach(([lang, data]) => {
            if (!acc[lang]) {
                acc[lang] = {};
            }
            Object.entries(data).forEach(([key, value]) => {



                for (const [replacementType, replacements] of Object.entries(replaceMents)) {
                    if (key in replacements) {
                        
                        
                        const lastDotIndex = key.lastIndexOf('.');
                        const actualKey = key.substring(0, lastDotIndex);
                        const type = key.substring(lastDotIndex + 1);

                        if (type !== 'name') {
                            console.warn(`Unexpected type "${type}" for key "${key}". Expected "name".`);
                            continue;
                        }
                        if (!acc[lang][actualKey]) {
                            acc[lang][actualKey] = [];
                        }
                        acc[lang][actualKey].push({
                            original: replacements[key],
                            type: type,
                            text: value
                        });

                    }
                }

            });
        });
        return acc;
    }, {} as Record<string, Record<string, { original: string, type: 'name', text: string }[]>>);

    fs.writeFileSync('./src/data-translationOverrides.g.ts', `export const translationOverirdes = ${JSON.stringify(overrideData, undefined, 2)}\n`);


}
generateOverrideUi();


fs.writeFileSync('./src/data-translations.ts', `export const translations = ${JSON.stringify(mergedTranslations, undefined, 2)}\n`);
console.log('Finished writing translations to src/data-translations.ts');


//check if ids are unique in all json files

function getIdsPerPath(dir: string): Record<string, string[]> {
    const files = fs.readdirSync(dir);
    const ids: Record<string, string[]> = {};
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            Object.assign(ids, getIdsPerPath(filePath));
        } else if (file.endsWith('.json') || file.endsWith('.jsonc')) {
            const data = fs.readFileSync(filePath, 'utf-8');
            try {
                const parsedData = JSON.parse(transformJsoncToJSON(data));
                if (!ids[filePath]) {
                    ids[filePath] = [];
                }

                const idsInFile = Object.values(parsedData).filter(x => Array.isArray(x)).flat().map(x => x.id).filter((x): x is string => typeof x === 'string');

                ids[filePath].push(...idsInFile);
            } catch (error) {
                console.error(`Error parsing JSON in ${filePath}:`, error);
            }
        }
    }
    return ids;
}

const ids = getIdsPerPath('./data');
const idsToPath = Object.entries(ids).reduce((acc, [file, ids]) => {
    ids.forEach(id => {
        if (!acc[id]) {
            acc[id] = [];
        }
        acc[id].push(file);
    });
    return acc;
}, {} as Record<string, string[]>);

const idsWithMorePaths = Object.entries(idsToPath).filter(([id, paths]) => paths.length > 1);
if (idsWithMorePaths.length > 0) {
    console.error('Found duplicate IDs in the following files:');
    idsWithMorePaths.forEach(([id, paths]) => {
        console.error(`ID "${id}" found in files: ${paths.join(', ')}`);
    });
    exit(1);
}