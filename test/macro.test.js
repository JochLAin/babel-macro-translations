import { createTranslator } from "../translations-json.macro";
const translator = createTranslator();

test('Simplest translations', () => {
    expect(translator.translate('hello')).toBe('Hello');
});

test('Simple translations with locale parameter', () => {
    expect(translator.translate('hello', null, null, 'fr')).toBe('Bonjour');
});

test('Simple translations with domain parameter', () => {
    expect(translator.translate('This field is required.', null, 'forms')).toBe('This field is required.');
    expect(translator.translate('This field is required.', null, 'forms', 'fr')).toBe('Ce champs est obligatoire.');
});

test('Simple translations with unknown domain parameter', () => {
    expect(translator.translate('hello', null, 'validators')).toBe('hello');
});

test('Simple translations with uninformed locale parameter', () => {
    expect(translator.translate('hello', null, null, 'ar')).toBe('hello');
});

test('Simple translation with helpers', () => {
    expect(translator.translate('hello')).toBe('Hello');
    expect(translator.withLocale('fr').translate('hello')).toBe('Bonjour');
    expect(translator.withDomain('forms').translate('This field is required.')).toBe('This field is required.');
    expect(translator.with({ domain: 'forms', locale: 'fr' }).translate('This field is required.')).toBe('Ce champs est obligatoire.');
});

test('Compound key translations', () => {
    expect(translator.translate('very.compound.key')).toBe('The compound key');
    expect(translator.withLocale('fr').translate('very.compound.key')).toBe('La clé composée');
});

test('Fake compound key translations', () => {
    expect(translator.translate('translations.are.incredible')).toBe('The translations are incredible.');
    expect(translator.withLocale('fr').translate('translations.are.incredible')).toBe('Les traductions sont incroyables.');
});

test('Plural translations', () => {
    const translatorEn = translator.withDomain('times');
    const translatorFr = translatorEn.withLocale('fr');

    expect(translatorEn.translate('diff.ago.year', { count: 1 })).toBe('1 year ago');
    expect(translatorEn.translate('diff.ago.year', { count: 2 })).toBe('2 years ago');
    expect(translatorFr.translate('diff.ago.year', { count: 1 })).toBe('il y a 1 an');
    expect(translatorFr.translate('diff.ago.year', { count: 2 })).toBe('il y a 2 ans');
});
