# babel-macro-translations

Babel macro for @jochlain/translations

> **Disclaimer :** This part is strongly inspired from [babel macros from fontawesome](https://fontawesome.com/docs/web/use-with/react/add-icons).

> The module uses package [intl-messageformat](https://www.npmjs.com/package/intl-messageformat) to format / pluralize message.

## Installation

In a real project, translations are not simple objects but files, like in a [Symfony project](https://symfony.com/).  
That's why I added a [Babel macro](https://www.npmjs.com/package/babel-plugin-macros) to import and format these same files.

It allows you to create a translator and use it easily, with node, with webpack or in server-side rendering.  
I'll take the example of a Symfony project to be more concrete.

<details>
    <summary><b>translations/messages.en.yaml</b></summary>

```yaml
hello: "Hello"
awesome: "Awesome"
```
</details>

<details>
    <summary><b>translations/messages.fr.yaml</b></summary>

```yaml
hello: "Bonjour"
awesome: "Incroyable"
```
</details>

<details>
    <summary><b>translations/forms.en.yaml</b></summary>

```yaml
required: "required"
```
</details>

<details>
    <summary><b>translations/forms.fr.yaml</b></summary>

```yaml
required: "obligatoire"
```
</details>

### Install the babel macros

```shell
npm install --save babel-plugin-macros
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
    '@jochlain/translations': {
        rootDir: 'translations',
        extension: 'yaml',
    },
};
```

_(I fill it with default values)_

## Usage

Then you can add your translations use the syntax below wherever you want then to appear in your project.

```javascript
import createTranslator from "@jochlain/translations/import.macro";

const translator = createTranslator();
translator.translate('hello') // => "Hello"
translator.translate('required', null, 'forms', 'fr') // => "obligatoire"

// Only specific domain
const translator = createTranslator(null || undefined, { domain: 'messages' });
translator.translate('awesome'); // => "Awesome"
translator.translate('required', null, 'forms') // => "required"

// Only specific locale
const translator = createTranslator(null || undefined, { locale: 'fr' });
translator.translate('awesome'); // => "Incroyable"
translator.translate('required', null, 'forms') // => "obligatoire"
```

### Work with host scope

Imagine you have a project with a frontend and a backend, and frontend must not be able to access backend translations.

Host is directory path between `rootDir` and translation files.  
If `rootDir` is `translations` and translation file is under `translations/front/blog/messages.en.yaml` then `host` is `front/blog`

<details>
    <summary><b>translations/back/message.en.yaml</b></summary>

```yaml
"some back message": "it's private"
```
</details>

<details>
    <summary><b>translations/front/message.en.yaml</b></summary>

```yaml
"some front message": "it's public"
```
</details>

And call them like below.

```javascript
import createTranslator from "@jochlain/translations/import.macro";

const translatorFront = createTranslator('front');
translatorFront.translate('some back message') // => "some back message"
translatorFront.translate('some front message') // => "it's public"
```

```javascript
import createTranslator from "@jochlain/translations/import.macro";

const translatorBack = createTranslator('back');
const translatorFront = createTranslator('front', { domain: 'messages', locale: 'en' });

translatorBack.translate('some back message') // => "it's private"
translatorBack.translate('some front message') // => "some front message"
translatorFront.translate('some front message') // => "it's public"
```

### Good practices

In order to keep good performance, you can create a file by domain which can be included after by your different components.  
This avoids loading the files several times

```javascript
// ./assets/translators/index.js
import createTranslator from "@jochlain/translations/import.macro";

export default createTranslator('front');
```

```javascript
// ./assets/translators/back.js
import createTranslator from "@jochlain/translations/import.macro";

export default createTranslator('back');
```

```javascript
//./assets/views/index.js
import translator from '../translators';
translatorFront.translate('some front message') // => "it's public"
```

```javascript
//./assets/views/back/index.js
import translatorFront from '../../translators';
import translatorBack from '../../translators/back';

translatorFront.translate('some front message') // => "it's public"
translatorBack.translate('some back message') // => "it's private"
```