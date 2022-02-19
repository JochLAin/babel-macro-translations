# @jochlain/translations-json

Babel macro for [@jochlain/translations](https://www.npmjs.com/package/@jochlain/translations)

### With JSON files
### [With YAML files](https://www.npmjs.com/package/@jochlain/translations-yaml)

> **Disclaimer :** This module is inspired from [babel macros from fontawesome](https://fontawesome.com/docs/web/use-with/react/add-icons).

> This module uses package [intl-messageformat](https://www.npmjs.com/package/intl-messageformat) to format/pluralize message.

## Summary

- [Installation](#installation)
  - [Install babel macros](#install-the-babel-macros)
  - [Setup babel configuration](#setup-babel-configuration)
- [Usage](#usage)
  - [Macro translate](#translate-macro-usage)
  - [Macro createTranslator](#createtranslator-macro-usage)
  - [Work with host scope](#work-with-host-scope)
- [Create your own](#create-your-own)

## Installation

In a real project, translations are not simple objects but files, like in a [Symfony project](https://symfony.com/doc/current/translation.html#translation-resource-file-names-and-locations).  
That's why I added a [Babel macro](https://www.npmjs.com/package/babel-plugin-macros) to import and format these same files.

It allows you to create a translator and use it easily, with node, with webpack or in server-side rendering.  
[Here are translation files](https://github.com/JochLAin/babel-macro-translations/tree/main/test/translations) that I used below.

### Install the babel macros

```shell
npm install --save babel-plugin-macros @jochlain/translations-json
```

### Setup babel configuration

Next, you'll need to configure the babel plugins. Add the following to your `.babelrc.js` file:

```javascript
module.exports = function (api) {
    //...
    return {
        // ...
        plugins: [
            // ...
            'macros',
        ],
    };
};
```

Then, create `babel-plugin-macros.config.js` file and add the `@jochlain/translations` settings.
You can set the `rootDir` and `extension` used for translations.

```javascript
module.exports = {
    '@jochlain/translations-json': {
        rootDir: 'translations', // Default value
    },
};
```

## Usage

### `translate` macro usage

The `translate` macro is the best option if you shared between server and client.
It permits loading only messages that you used to script.

It has 2 forms :
- With literal locale : string with quotes like 'en' or 'fr'
> It will replace call method with string directly.
- With identifier locale : a variable
> It calls `translate` static method of [@jochlain/translations](https://www.npmjs.com/package/@jochlain/translations)

### Examples

```javascript
import { translate } from "@jochlain/translations-json/macro";

translate('hello');
translate('hello', null, { locale: 'en' });
translate('This field is required.', null, { domain: 'forms' });
translate('diff.ago.year', { count: 1 }, { domain: 'times' });

const locale = 'en';
translate('hello', null, { locale });
translate('diff.ago.minute', { count: 2 }, { domain: 'times', locale });
```

> More usage example [here](https://github.com/JochLAin/babel-macro-translations/blob/main/test/translate.test.js)

<details>
    <summary><b>Transformed code</b></summary>

```javascript
import createTranslator from "@jochlain/translations-json/macro";
import { translate as _translate } from "@jochlain/translations"
import { IntlMessageFormat as _IntlMessageFormat } from "intl-messageformat";
const jochlain_translations_intl_formatter = {
    format: function (message, replacements, locale) {
        return (new IntlMessageFormat(message, locale)).format(replacements);
    },
};

"Hello";
"Hello";
"This field is required.";
"1 year ago";

const locale = 'en';
_translate({ en: 'Hello', es: 'Holà', fr: 'Bonjour', it: 'Ciao' }, {}, { locale, formatter: jochlain_translations_intl_formatter });
_translate({ 
    en: '{count, plural, one {1 minute ago} other {# minutes ago}}',
    es: '{count, plural, one {hace 1 minuto} other {hace # minutos}}',
    fr: '{count, plural, one {il y a 1 minute} other {il y a # minutes}}', 
    it: '{count, plural, one {1 minuto fa} other {# minuti fa}}'
}, { 
    count: 2
}, { 
    locale, 
    formatter: jochlain_translations_intl_formatter
});
```
</details>

### `createTranslator` macro usage

If you can separate client and server translations, to keep compilation performance you can create a translator with all translations.

```javascript
import { createTranslator } from "@jochlain/translations-json/macro";

// Load all files
const translator = createTranslator();
// Load all files for a domain
const translator = createTranslator({ domain: 'forms' });
// Load all files for a locale
const translator = createTranslator({ locale: 'fr' });
```

> More usage example [here](https://github.com/JochLAin/babel-macro-translations/blob/main/test/createTranslator.test.js)

<details>
    <summary><b>Transformed code</b></summary>

```javascript
import createTranslator from "@jochlain/translations-json/macro";
import _createTranslator from "@jochlain/translations"
import { IntlMessageFormat } from "intl-messageformat";
const formatter = {
    format: function (message, replacements, locale) {
        return (new IntlMessageFormat(message, locale)).format(replacements);
    },
};

const translator = createTranslator(/* see below to view full catalog */, { formatter });
const translator = createTranslator(/* see below to view single domain catalog */, { formatter, domain: 'forms' });
const translator = createTranslator(/* see below to view single locale catalog */, { formatter, locale: 'fr' });
```
</details>

#### Catalogs transformed

<details>
    <summary>Full catalog</summary>

```json
{
  "en": {
    "forms": {
      "This field is required.": "This field is required."
    },
    "messages": {
      "hello": "Hello",
      "translations.are.incredible": "The translations are incredible.",
      "very": {
        "compound": {
          "key": "The compound key"
        }
      }
    },
    "times": {
      "diff": {
        "empty": "now",
        "ago": {
          "year": "{count, plural, one {1 year ago} other {# years ago}}",
          "month": "{count, plural, one {1 month ago} other {# months ago}}",
          "day": "{count, plural, one {1 day ago} other {# days ago}}",
          "hour": "{count, plural, one {1 hour ago} other {# hours ago}}",
          "minute": "{count, plural, one {1 minute ago} other {# minutes ago}}",
          "second": "{count, plural, one {1 second ago} other {# seconds ago}}"
        },
        "in": {
          "second": "{count, plural, one {in 1 second} other {in # seconds}}",
          "minute": "{count, plural, one {in 1 minute} other {in # minutes}}",
          "hour": "{count, plural, one {in 1 hour} other {in # hours}}",
          "day": "{count, plural, one {in 1 day} other {in # days}}",
          "month": "{count, plural, one {in 1 month} other {in # months}}",
          "year": "{count, plural, one {in 1 year} other {in # years}}"
        }
      }
    }
  },
  "es": {
    "messages": {
      "hello": "Holà",
      "translations.are.incredible": "Las traducciones son increíbles.",
      "very": {
        "compound": {
          "key": "La llave compuesta"
        }
      }
    },
    "times": {
      "diff": {
        "empty": "ahora",
        "ago": {
          "year": "{count, plural, one {hace 1 año} other {hace # años}}",
          "month": "{count, plural, one {hace 1 mes} other {hace # meses}}",
          "day": "{count, plural, one {hace 1 día} other {hace # días}}",
          "hour": "{count, plural, one {hace 1 hora} other {hace # horas}}",
          "minute": "{count, plural, one {hace 1 minuto} other {hace # minutos}}",
          "second": "{count, plural, one {hace 1 segundo} other {hace # segundos}}"
        },
        "in": {
          "second": "{count, plural, one {en 1 segundo} other {en # segundos}}",
          "minute": "{count, plural, one {en 1 minuto} other {en # minutos}}",
          "hour": "{count, plural, one {en 1 hora} other {en # horas}}",
          "day": "{count, plural, one {en 1 día} other {en # días}}",
          "month": "{count, plural, one {en 1 mes} other {en # meses}}",
          "year": "{count, plural, one {en 1 año} other {en # años}}"
        }
      }
    }
  },
  "fr": {
    "forms": {
      "This field is required.": "Ce champs est obligatoire."
    },
    "messages": {
      "hello": "Bonjour",
      "translations.are.incredible": "Les traductions sont incroyables.",
      "very": {
        "compound": {
          "key": "La clé composée"
        }
      }
    },
    "times": {
      "diff": {
        "empty": "maintenant",
        "ago": {
          "year": "{count, plural, one {il y a 1 an} other {il y a # ans}}",
          "month": "{count, plural, one {il y a 1 mois} other {il y a # mois}}",
          "day": "{count, plural, one {il y a 1 jour} other {il y a # jours}}",
          "hour": "{count, plural, one {il y a 1 heure} other {il y a # heures}}",
          "minute": "{count, plural, one {il y a 1 minute} other {il y a # minutes}}",
          "second": "{count, plural, one {il y a 1 seconde} other {il y a # secondes}}"
        },
        "in": {
          "second": "{count, plural, one {dans 1 seconde} other {dans # secondes}}",
          "minute": "{count, plural, one {dans 1 minute} other {dans # minutes}}",
          "hour": "{count, plural, one {dans 1 heure} other {dans # heures}}",
          "day": "{count, plural, one {dans 1 jour} other {dans # jours}}",
          "month": "{count, plural, one {dans 1 mois} other {dans # mois}}",
          "year": "{count, plural, one {dans 1 an} other {dans # ans}}"
        }
      }
    }
  },
  "it": {
    "messages": {
      "hello": "Ciao",
      "translations.are.incredible": "Le traduzioni sono incredibili.",
      "very": {
        "compound": {
          "key": "La chiave composta"
        }
      }
    },
    "times": {
      "diff": {
        "empty": "ora",
        "ago": {
          "year": "{count, plural, one {1 anno fa} other {# anni fa}}",
          "month": "{count, plural, one {1 mese fa} other {# mesi fa}}",
          "day": "{count, plural, one {1 giorno fa} other {# giorni fa}}",
          "hour": "{count, plural, one {1 ora fa} other {# ore fa}}",
          "minute": "{count, plural, one {1 minuto fa} other {# minut fa}}",
          "second": "{count, plural, one {1 secondo fa} other {# secondi fa}}"
        },
        "in": {
          "second": "{count, plural, one {tra 1 secondo} other {tra # secondi}}",
          "minute": "{count, plural, one {tra 1 minuto} other {tra # minut}}",
          "hour": "{count, plural, one {tra 1 ora} other {tra # ore}}",
          "day": "{count, plural, one {tra 1 giorno} other {tra # giorni}}",
          "month": "{count, plural, one {tra 1 mese} other {tra # mesi}}",
          "year": "{count, plural, one {tra 1 anno} other {tra # anni}}"
        }
      }
    }
  }
}
```
</details>

<details>
    <summary>Single domain catalog</summary>

```json
{
  "en": {
    "forms": {
      "This field is required.": "This field is required."
    }
  },
  "fr": {
    "forms": {
      "This field is required.": "Ce champs est obligatoire."
    }
  }
}
```
</details>

<details>
    <summary>Single locale catalog</summary>

```json
{
  "fr": {
    "forms": {
      "This field is required.": "Ce champs est obligatoire."
    },
    "messages": {
      "hello": "Bonjour",
      "translations.are.incredible": "Les traductions sont incroyables.",
      "very": {
        "compound": {
          "key": "La clé composée"
        }
      }
    },
    "times": {
      "diff": {
        "empty": "maintenant",
        "ago": {
          "year": "{count, plural, one {il y a 1 an} other {il y a # ans}}",
          "month": "{count, plural, one {il y a 1 mois} other {il y a # mois}}",
          "day": "{count, plural, one {il y a 1 jour} other {il y a # jours}}",
          "hour": "{count, plural, one {il y a 1 heure} other {il y a # heures}}",
          "minute": "{count, plural, one {il y a 1 minute} other {il y a # minutes}}",
          "second": "{count, plural, one {il y a 1 seconde} other {il y a # secondes}}"
        },
        "in": {
          "second": "{count, plural, one {dans 1 seconde} other {dans # secondes}}",
          "minute": "{count, plural, one {dans 1 minute} other {dans # minutes}}",
          "hour": "{count, plural, one {dans 1 heure} other {dans # heures}}",
          "day": "{count, plural, one {dans 1 jour} other {dans # jours}}",
          "month": "{count, plural, one {dans 1 mois} other {dans # mois}}",
          "year": "{count, plural, one {dans 1 an} other {dans # ans}}"
        }
      }
    }
  }
}
```
</details>

### Work with host scope

Imagine you have a project with a frontend and a backend, and frontend must not be able to access backend translations.

Host is directory path between `rootDir` and translation files.  
If `rootDir` is `translations` and translation file is under `translations/front/blog/messages.en.json` then `host` is `front/blog`

And call them like below.

```javascript
import createTranslator from "@jochlain/translations-json/macro";

const translatorFront = createTranslator();
translatorFront.translate('some back message') // => "some back message"
translatorFront.translate('some front message') // => "it's public"
```

```javascript
import createTranslator from "@jochlain/translations-json/macro";

const translatorBack = createTranslator({ host: 'back' });
const translatorFront = createTranslator();

translatorBack.translate('some back message') // => "it's private"
translatorBack.translate('hello') // => "hello"
translatorFront.translate('some back message') // => "some back message"
translatorFront.translate('hello') // => "Hello"
```

#### Good practices

In order to keep good performance, you can create a file by domain which can be included after in your different components.  
This avoids loading catalogs several times.

```javascript
// ./assets/translators/index.js
import createTranslator from "@jochlain/translations-json/macro";

export default createTranslator('front');
```

```javascript
// ./assets/translators/back.js
import createTranslator from "@jochlain/translations-json/macro";

export default createTranslator('back');
```

```javascript
//./assets/views/index.js
import translator from '../translators';
translatorFront.translate('hello') // => "Hello"
```

```javascript
//./assets/views/back/index.js
import translatorBack from '../../translators/back';
import translatorFront from '../../translators';

translatorBack.translate('some back message') // => "it's private"
translatorFront.translate('hello') // => "Hello"
```

## Create your own

```javascript
var { createMacro } = require("babel-plugin-macros");
var getTranslationMacro = require("./lib").default;

var macro = getTranslationMacro({
    extension: /__YOUR_EXTENSION_REGEX__/,
    load: function (content) {
        // From file content return parsed object
    },
});

module.exports = createMacro(macro, {
    configName: '__YOUR_NAME__',
});

```