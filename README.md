# Deprecated

This component is deprecated. Use `@advanced-rest-client/app` instead.

----

This module contains all UIs related to Advanced REST Client requests.

This library contains:

- ARC request editor
- ARC request panel (editor + response view)
- ARC workspace

The workspace serves as an entire main application screen in Advanced REST Client. It only needs connecting it with the ARC event system and the data models. The workspace also need the application to handle few basic events (data read/write, filesystem I/O, etc). This is done in the final application shell that provides platform binding (web platform, Electron, Chrome, etc).

See the `demo/request-workspace.js` for a complete example of implementation.

## Main components used in these components

- `@advanced-rest-client/arc-headers` The headers editor, headers parser
- `@advanced-rest-client/arc-url` - The UI for the URL editor, URL parser
- `@advanced-rest-client/body-editor` - The body editor, payload transformer, Monaco body editor, CodeMirror body editor, Multipart body editor, Form data body editor
- `@advanced-rest-client/arc-actions` - The request and response actions editors, actions runner
- `@advanced-rest-client/http-code-snippets` - Code snippets
- `@advanced-rest-client/arc-response` - The entire response view
- `@advanced-rest-client/arc-ie` - Export data dialogs, export processors
- `@advanced-rest-client/arc-models` - Database access to ARC data

## Usage

### Installation

```sh
npm install --save @advanced-rest-client/arc-request-ui
```

## Development

```sh
git clone https://github.com/advanced-rest-client/arc-request-ui
cd arc-request-ui
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests

```sh
npm test
```
