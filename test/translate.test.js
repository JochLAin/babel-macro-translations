import { translate } from "../macro";

const locale = 'fr';

test('Translate macro with default locale', () => {
    expect(translate('hello')).toBe('Hello');
});

test('Translate macro with unknown domain parameter', () => {
    expect(translate('hello', null, { domain: 'validators' })).toBe('hello');
});

test('Translate macro with uninformed locale parameter', () => {
    expect(translate('hello', null, { locale: 'ar' })).toBe('hello');
});

test('Translate macro with locale literal', () => {
    expect(translate('hello', null, { locale: 'fr' })).toBe('Bonjour');
});

test('Translate macro with locale variable', () => {
    expect(translate('hello', null, { locale })).toBe('Bonjour');
});

test('Translate macro with compound key', () => {
    expect(translate('very.compound.key')).toBe('The compound key');
    expect(translate('very.compound.key', null, { locale: 'fr' })).toBe('La clé composée');
    expect(translate('very.compound.key', null, { locale })).toBe('La clé composée');
});

test('Translate macro with fake compound key', () => {
    expect(translate('translations.are.incredible')).toBe('The translations are incredible.');
    expect(translate('translations.are.incredible', null, { locale: 'fr' })).toBe('Les traductions sont incroyables.');
    expect(translate('translations.are.incredible', null, { locale })).toBe('Les traductions sont incroyables.');
});

test('Translate macro with plural translations', () => {
    expect(translate('diff.ago.year', { count: 1 }, { domain: 'times' })).toBe('1 year ago');
    expect(translate('diff.ago.year', { count: 2 }, { domain: 'times' })).toBe('2 years ago');

    expect(translate('diff.ago.year', { count: 1 }, { domain: 'times', locale: 'fr' })).toBe('il y a 1 an');
    expect(translate('diff.ago.year', { count: 2 }, { domain: 'times', locale: 'fr' })).toBe('il y a 2 ans');

    expect(translate('diff.ago.year', { count: 1 }, { domain: 'times', locale })).toBe('il y a 1 an');
    expect(translate('diff.ago.year', { count: 2 }, { domain: 'times', locale })).toBe('il y a 2 ans');
});

test('Translate macro with host parameter', () => {
    expect(translate('hello', null, { host: 'back' })).toBe('hello');

    expect(translate('some back message', null, { host: 'back' })).toBe("it's private");
    expect(translate('some back message', null, { host: 'back', locale: 'fr' })).toBe("c'est privé");
    expect(translate('some back message', null, { host: 'back', locale })).toBe("c'est privé");
});
