import { createTranslator } from "../macro";
const translator = createTranslator();

test('CreateTranslator macro with simplest translations', () => {
    expect(translator.translate('hello')).toBe('Hello');
});

test('CreateTranslator macro with simple translations with locale parameter', () => {
    expect(translator.translate('hello', null, null, 'fr')).toBe('Bonjour');
});

test('CreateTranslator macro with simple translations with domain parameter', () => {
    expect(translator.translate('This field is required.', null, 'forms')).toBe('This field is required.');
    expect(translator.translate('This field is required.', null, 'forms', 'fr')).toBe('Ce champs est obligatoire.');
});

test('CreateTranslator macro with simple translations with unknown domain parameter', () => {
    expect(translator.translate('hello', null, 'validators')).toBe('hello');
});

test('CreateTranslator macro with simple translations with uninformed locale parameter', () => {
    expect(translator.translate('hello', null, null, 'ar')).toBe('hello');
});

test('CreateTranslator macro with simple translation with helpers', () => {
    expect(translator.translate('hello')).toBe('Hello');
    expect(translator.withLocale('fr').translate('hello')).toBe('Bonjour');
    expect(translator.withDomain('forms').translate('This field is required.')).toBe('This field is required.');
    expect(translator.with({ domain: 'forms', locale: 'fr' }).translate('This field is required.')).toBe('Ce champs est obligatoire.');
});

test('CreateTranslator macro with compound key translations', () => {
    expect(translator.translate('very.compound.key')).toBe('The compound key');
    expect(translator.withLocale('fr').translate('very.compound.key')).toBe('La clé composée');
});

test('CreateTranslator macro with fake compound key translations', () => {
    expect(translator.translate('translations.are.incredible')).toBe('The translations are incredible.');
    expect(translator.withLocale('fr').translate('translations.are.incredible')).toBe('Les traductions sont incroyables.');
});

test('CreateTranslator macro with plural translations', () => {
    const translatorEn = translator.withDomain('times');
    const translatorFr = translatorEn.withLocale('fr');

    expect(translatorEn.translate('diff.ago.year', { count: 1 })).toBe('1 year ago');
    expect(translatorEn.translate('diff.ago.year', { count: 2 })).toBe('2 years ago');
    expect(translatorFr.translate('diff.ago.year', { count: 1 })).toBe('il y a 1 an');
    expect(translatorFr.translate('diff.ago.year', { count: 2 })).toBe('il y a 2 ans');
});

test('CreateTransator macro with domain parameter', () => {
    const translator = createTranslator({ domain: 'forms' });

    expect(translator.translate('hello')).toBe('hello');
    expect(translator.translate('This field is required.')).toBe('This field is required.');
    expect(translator.withLocale('fr').translate('This field is required.')).toBe('Ce champs est obligatoire.');
});

test('CreateTransator macro with locale parameter', () => {
    const translator = createTranslator({ locale: 'fr' });

    expect(translator.translate('hello')).toBe('Bonjour');
    expect(translator.withLocale('en').translate('hello')).toBe('hello');
});

test('CreateTranslator macro with host parameter', () => {
    const translator = createTranslator({ host: 'back' });

    expect(translator.translate('hello')).toBe('hello');
    expect(translator.translate('some back message')).toBe("it's private");
    expect(translator.withLocale('fr').translate('some back message')).toBe("c'est privé");
});
