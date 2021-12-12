const path = require("path");
const Generator = require("yeoman-generator");

// https://github.com/yeoman/generator/releases/tag/v5.0.0
Object.assign(
  Generator.prototype,
  require("yeoman-generator/lib/actions/install")
);

const SingleSpaReactGenerator = require("./react/generator-react-app");
const versionUpdateCheck = require("./version-update-check");
const { version } = require("../package.json");

module.exports = class SingleSpaGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("dir", {
      type: String,
    });

    this.option("framework", {
      type: String,
    });

    this.option("moduleType", {
      type: String,
    });

    this.option("skipInstall", {
      type: Boolean,
    });

    if (args.length > 0 && !this.options.dir) {
      this.options.dir = args[0];
    }

    Object.keys(this.options).forEach((optionKey) => {
      if (this.options[optionKey] === "false") this.options[optionKey] = false;
    });
  }
  initializing() {
    const { stdout } = this.spawnCommandSync(
      "npm",
      ["view", "create-single-spa@latest", "version"],
      { stdio: "pipe" }
    );

    const remoteVersion =
      stdout && stdout.toString && stdout.toString("utf8").trim();

    if (remoteVersion) versionUpdateCheck(version, remoteVersion);
  }
  async chooseDestinationDir() {
    if (!this.options.dir) {
      const response = await this.prompt([
        {
          type: "input",
          name: "dir",
          message: "Directory for new project",
          default: ".",
        },
      ]);

      this.options.dir = response.dir;
    }
  }
  async composeChildGenerator() {
    let moduleType = this.options.moduleType;

    if (!moduleType && this.options.framework) {
      moduleType = "app-parcel";
    }

    if (!moduleType) {
      moduleType = (
        await this.prompt([
          {
            type: "list",
            name: "moduleType",
            message: "Select type to generate",
            choices: [
              { name: "front-end application", value: "app-parcel" },
            ],
          },
        ])
      ).moduleType;
    }

    if (moduleType === "app-parcel") {
      await runFrameworkGenerator.call(this);
    } else {
      throw Error(
        `unknown moduleType option ${moduleType}. Valid values are root-config, app-parcel, util-module`
      );
    }
  }
  _setDestinationDir() {
    if (this.options.dir) {
      const root = path.isAbsolute(this.options.dir)
        ? this.options.dir
        : path.resolve(process.cwd(), this.options.dir);
      this.destinationRoot(root);
    }
  }
};

async function runFrameworkGenerator() {
  if (!this.options.framework) {
    const answers = await this.prompt([
      {
        type: "list",
        name: "framework",
        message: "Which framework do you want to use?",
        choices: ["react", "other"],
      },
    ]);

    this.options.framework = answers.framework;
  }

  switch (this.options.framework) {
    case "react":
      this._setDestinationDir();

      this.composeWith(
        {
          Generator: SingleSpaReactGenerator,
          path: require.resolve("./react/generator-single-spa-react.js"),
        },
        this.options
      );
      break;
    case "other":
      console.log(
        `Check https://github.com/single-spa/create-single-spa/issues for updates on new frameworks being added to create-single-spa. Feel free to create a new issue if one does not yet exist for the framework you're using.`
      );
      break;
    default:
      throw Error(`Unsupported framework '${this.options.framework}'`);
  }
}
