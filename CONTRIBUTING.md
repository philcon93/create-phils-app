# Local development

## Running the create-phils-spa CLI

We're using [yarn workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

1. `yarn install`
2. `node packages/create-phils-app/bin/create-phils-app.js ../some-test-dir`

Note that create-phils-spa can run in the current directory by default, but you can provide a different destination directory through the CLI (as shown above with `some-test-dir`).

