// import { characters } from './model/characters';
// import { incidents } from './model/incidents';
// import { plots } from './model/plots';
// import { roles } from './model/roles';
// import { tragedySets } from './model/tragedySets';
import { translations as data } from './data-translations';
import { browser } from '$app/environment';
import { getLocalisatio } from './storage';
import { ui_strings } from './data-ui-strings';
import { charactersLookup,  incidentsLookup, isCharacterId,  isPlotId,   plotsLookup, isKeywordId, keywordsLookup, isTagId, tagsLookup, rolesLookup, tragedysLookup } from './data';
import MarkdownIt, { type Options } from 'markdown-it';
import { isIncidentName } from './model/incidents';
import { isRoleName, singleRolenames } from './model/roles';
import { isTragedySetName } from './model/tragedySets';



function getLinksFromMarkdown(markdown: string): Set<string> {
    const links = new Set<string>();

    const md = MarkdownIt({
        html: false,
        linkify: false,
        typographer: true,
    });

    // add base to links
    const originalValidateLink = md.validateLink;
    md.validateLink = (link: string) => {
        // Allow all links, even if they are not valid URLs
        console.log('Validating link:', link);
        if (link) {
            links.add(link);
        }

        return originalValidateLink.call(md, link);
    }
    md.parseInline(markdown, {});
    return links;
}




const toCheck = [
    ...ui_strings,
    'Location Icons',
    'Intrigue Places',
    'kind off',
    'Location background',
    'could be better',
    'Dispair place',
    'Day stages',
    'They are already prety clean, but images and not text.',
    'Day track',
    'Incident track',
    'Loop track',
    'Extra gauge',
    'Additional decorations',
];

const allStrings = toCheck;

const missingInToCheck: Set<string> = new Set();

const translation: Record<string, Record<string, string>> = data;

// mapp {TAG} to object with key tag and value unknown
export type ObjectFromTagedVoid<T extends string | undefined> =
    T extends undefined
    ? void
    : T extends `${string}{${string}}${string}`
    ? ObjectFromTagedGet<T>
    : T extends `${string}{${string}}`
    ? ObjectFromTagedGet<T>
    : void;
export type ObjectFromTaged<T extends string | undefined> =
    T extends undefined
    ? {}
    : T extends `${string}{${string}}${string}`
    ? ObjectFromTagedGet<T>
    : T extends `${string}{${string}}`
    ? ObjectFromTagedGet<T>
    : {};
type ObjectFromTagedGet<T extends string> =
    T extends `${string}{${infer Tag}}${infer Rest}`
    ? { [K in Tag]: unknown } & ObjectFromTagedGet<Rest>
    : T extends `${string}{${infer Tag}}`
    ? { [K in Tag]: unknown }
    : {};

export type ObjectFromTagedArray<T extends string | undefined> = keyof ObjectFromTaged<T> extends never
    ? []
    : [ObjectFromTaged<T>];


export function translationExists(lang: string, key: string): boolean {
    if (!lang || !key) {
        return false;
    }
    if (lang == 'en') {
        return true; // English is always available
    }
    const keyTrimed = key.trim();
    if (keyTrimed.includes('|')) {
        return keyTrimed.split('|').every(k => translationExists(lang, k));
    }
    if (translation[lang] && translation[lang][keyTrimed] && translation[lang][keyTrimed].length > 0) {
        return true;
    }

    if (/^:[a-zA-Z0-9_]+:$/.test(keyTrimed)) {
        // identifier are translated if the key is translated.
        const identifier = keyTrimed.match(/:([a-zA-Z0-9_]+):/)![1];
        const translation = isIdentifier(identifier, lang);
        if (translation.isIdentifier && translation.translated !== false) {
            return true;
        }

        return false;
    }

    const localTranslation =
        (browser && getLocalisatio(lang) && getLocalisatio(lang)[keyTrimed]) ? getLocalisatio(lang)[keyTrimed] : undefined;
    if (localTranslation && localTranslation.length > 0) {
        return true;
    }
    return false
}

export function hasLocalTranslation(lang: string, key: string): boolean {
    if (!lang) {
        return false;
    }
    if (browser) {
        const localTranslation = getLocalisatio(lang);
        if (localTranslation && localTranslation[key]) {
            return localTranslation[key].length > 0;
        }
    }
    return false;
}

export function getStringForLanguage<TKey extends string | undefined>(key: TKey, lang: string | undefined, ...params: ObjectFromTagedArray<TKey>): string {
    if (!key) {
        return "";
    }

    // return JSON.stringify(params);

    if (key.includes('|')) {
        return key.split('|').map(k => getStringForLanguage(k, lang)).join('|');
    }

    const keyTrimed = key.trim()
    const toTest = allStrings;
    if (!toTest.includes(key)) {
        missingInToCheck.add(key);
        console.info('Missing Translations', [...missingInToCheck]);
    }

    if (!lang) {
        lang = 'en'; // Default to English if no language is provided
        // let translated = keyTrimed;
        // Object.entries(params[0] ?? {}).forEach(([name, value]) => {
        //     translated = translated.replaceAll(`{${name.toString()}}`, `${value}`);
        // })

        // return keyTrimed;
    }
    let translated = translation[lang]?.[keyTrimed] ?? keyTrimed;
    if (translated == undefined || translated.length == 0) {
        translated = keyTrimed; // Fallback to key if no translation is found
    }

    const localTranslation =
        (browser && getLocalisatio(lang) && getLocalisatio(lang)[keyTrimed]) ? getLocalisatio(lang)[keyTrimed] : undefined;

    if (localTranslation && localTranslation != translated)
        translated = '«' + localTranslation + '»';


    Object.entries(params[0] ?? {}).forEach(([name, value]) => {
        translated = translated.replaceAll(`{${name.toString()}}`, `${value}`);
    })

    const result = translated.length > 0 ? translated : keyTrimed;

    // Check that every link in the result was also in the key
    const linksInResult = getLinksFromMarkdown(result);
    const linksInKey = getLinksFromMarkdown(keyTrimed);
    const linksNotInKey = [...linksInResult].filter(link => !linksInKey.has(link));
    if (linksNotInKey.length > 0) {
        console.error(`Links in translation for "${keyTrimed}" in language "${lang}" not found in key:`, linksNotInKey);
        return `${keyTrimed} (**ERROR**: unknown links: ${linksNotInKey.join(', ')} falling back to key)`;
    }
    return result;
}

export function getDeployedLanguage(): string[] {
    return ['en', ...Object.keys(translation).filter(x => x != 'en')];
}
export function getAllTranslationsForLanguage(lang: string) {
    const currentTranslation = { ...translation[lang], ...((browser && getLocalisatio(lang)) ? getLocalisatio(lang) : undefined) };


    if (lang == 'en') {
        allStrings.filter(x => x.length > 0).forEach(key => {
            if (currentTranslation[key] == undefined || currentTranslation[key].length == 0) {
                currentTranslation[key] = key;
            }
        });
    }
    return currentTranslation;
}
export function getMissingForLanguage(lang: string) {
    if (lang == 'en') {
        return [];
    }
    const currentTranslation = translation[lang] ?? {};

    const alreadyTranslated = Object.keys(currentTranslation ?? {}).filter(key => currentTranslation[key]?.length ?? 0 > 0);
    const neededKeys = allStrings.filter(x => x.length > 0);

    return neededKeys.filter(x => !alreadyTranslated.includes(x));
}

export function getAllKeys(): string[] {
    return allStrings.filter(x => x.length > 0);
}


export function isIdentifier(emojiName: string, lang: string): { isIdentifier: true, type: 'character' | 'incident' | 'role' | 'plot' | 'tragedy' | 'keyword' | 'tag', translated: string | false } | { isIdentifier: false } {
    if (isCharacterId(emojiName)) {
        const character = charactersLookup[emojiName];
        const translated = translation[lang]?.[character.name];
        return { isIdentifier: true, type: 'character', translated: translated ?? false };
    } else if (isIncidentName(emojiName)) {
        const incident = incidentsLookup[emojiName];
        const translated = translation[lang]?.[incident.name];
        return { isIdentifier: true, type: 'incident', translated: translated ?? false };
    } else if (isRoleName(emojiName)) {
        const roleNames = singleRolenames(emojiName);
        const translations = roleNames.map(roleName => {
            const role = rolesLookup[roleName];
            const translated = translation[lang]?.[role.name];
            return (translated ?? false) as string | false;

        });
        if (translations.every(t => t !== false)) {
            return { isIdentifier: true, type: 'role', translated: translations.join('|') };
        } else {
            return { isIdentifier: true, type: 'role', translated: false };
        }

    } else if (isPlotId(emojiName)) {
        const plot = plotsLookup[emojiName];
        const translated = translation[lang]?.[plot.name];
        return { isIdentifier: true, type: 'plot', translated: translated ?? false };
    } else if (isTragedySetName(emojiName)) {
        const tragedy = tragedysLookup[emojiName];
        const translated = translation[lang]?.[tragedy.name];
        return { isIdentifier: true, type: 'tragedy', translated: translated ?? false };
    } else if (isKeywordId(emojiName)) {
        const keyword = keywordsLookup[emojiName];
        const translated = translation[lang]?.[keyword.name];
        return { isIdentifier: true, type: 'keyword', translated: translated ?? false };
    } else if (isTagId(emojiName)) {
        const tag = tagsLookup[emojiName];
        const translated = translation[lang]?.[tag.name];
        return { isIdentifier: true, type: 'tag', translated: translated ?? false };
    } else {
        return { isIdentifier: false };
    }

}