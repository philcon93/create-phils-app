const Generator = require("yeoman-generator");
const ejs = require("ejs");
const fs = require("fs").promises;
const chalk = require("chalk");
const validate = require("../validate-naming");

module.exports = class SingleSpaReactGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("packageManager", {
      type: String,
    });
    this.option("typescript", {
      type: Boolean,
    });
    this.option("orgName", {
      type: String,
    });
    this.option("projectName", {
      type: String,
    });
    this.option("skipMainFile", {
      type: Boolean,
    });
  }
  async getOptions() {
    const answers = await this.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "Which package manager do you want to use?",
        choices: ["npm", "yarn"],
        when: !this.options.packageManager,
      },
      {
        type: "confirm",
        name: "typescript",
        message: "Will this project use Typescript?",
        default: false,
        when: this.options.typescript === undefined,
      },
      {
        type: "input",
        name: "orgName",
        message: "Organization name",
        suffix: " (can use letters, numbers, dash or underscore)",
        when: !this.options.orgName,
        validate,
      },
      {
        type: "input",
        name: "projectName",
        message: "Project name",
        suffix: " (can use letters, numbers, dash or underscore)",
        when: !this.options.projectName,
        validate,
      },
    ]);

    Object.assign(this.options, answers, { framework: "react" });
  }
  async createPackageJson() {
    this.srcFileExtension = this.options.typescript ? "tsx" : "js";
    this.mainFile = `src/index.${this.srcFileExtension}`;

    const packageJsonTemplate = await fs.readFile(
      this.templatePath("react.package.json"),
      { encoding: "utf-8" }
    );
    const packageJsonStr = ejs.render(packageJsonTemplate, {
      name: `@${this.options.orgName}/${this.options.projectName}`,
      packageManager: this.options.packageManager,
      typescript: this.options.typescript,
      mainFile: this.mainFile,
    });

    const packageJson = JSON.parse(packageJsonStr);

    this.fs.extendJSON(this.destinationPath("package.json"), packageJson);

    if (this.options.typescript) {
      // Extend with react-specific package json for typescript
      this.fs.extendJSON(
        this.destinationPath("package.json"),
        this.fs.readJSON(
          this.templatePath("typescript/typescript-react.package.json")
        )
      );
    }
  }
  async copyOtherFiles() {
    // Common
    this.fs.copyTpl(
      this.templatePath("../../common-templates/gitignore"), // this is relative to /templates
      this.destinationPath(".gitignore"),
      this.options
    );

    // Public
    this.fs.copy(
      this.templatePath('public'),
      this.destinationPath('public')
    );

    // Src
    this.fs.copyTpl(
      this.templatePath("src/App.css"),
      this.destinationPath("src/App.css"),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/App.js"),
      this.destinationPath(`src/App.${this.srcFileExtension}`),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/App.test.js"),
      this.destinationPath(`src/App.test.${this.srcFileExtension}`),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/index.css"),
      this.destinationPath("src/index.css"),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/index.js"),
      this.destinationPath(this.mainFile),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/logo.svg"),
      this.destinationPath("src/logo.svg"),
      this.options
    );
    this.fs.copyTpl(
      this.templatePath("src/setupTests.js"),
      this.destinationPath(`src/setupTests.${this.options.typescript ? 'ts' : 'js'}`),
      this.options
    );

    // Typescript
    if (this.options.typescript) {
      this.fs.copyTpl(
        this.templatePath("typescript/tsconfig.json"),
        this.destinationPath("tsconfig.json"),
        {
          ...this.options,
          mainFile: this.mainFile,
        }
      );
      this.fs.copyTpl(
        this.templatePath(
          `typescript/react-app-env.d.ts`
        ),
        this.destinationPath(`src/react-app-env.d.ts`),
        this.options
      );
    }

    const childGitInitProcess = this.spawnCommandSync("git", ["init"]);
    if (childGitInitProcess.error) {
      console.log(chalk.red("\n************"));
      console.log(chalk.red("Cannot initialize git repository"));
      console.log(chalk.red("************\n"));
    } else {
      console.log(chalk.green("\nInitialized git repository\n"));
    }
  }
  install() {
    if (!this.skipInstall) {
      this.installDependencies({
        npm: this.options.packageManager === "npm",
        yarn: this.options.packageManager === "yarn",
        bower: false,
      });
    }
  }
  finished() {
    this.on(`${this.options.packageManager}Install:end`, () => {
      console.log(
        chalk.bgWhite.black(`
      Success! Created @${this.options.orgName}/${this.options.projectName} at ${this.options.dir}
      Inside that directory, you can run several commands:

      yarn start
        Starts the development server.

      yarn build
        Bundles the app into static files for production.

      yarn test
        Starts the test runner.

      We suggest that you begin by typing:

      cd ${this.options.dir}
      yarn start`)
      );
    });
  }
};
