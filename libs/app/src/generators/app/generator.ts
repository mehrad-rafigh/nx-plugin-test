import {
  formatFiles,
  getWorkspaceLayout,
  names,
  readProjectConfiguration,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import * as path from 'path';
import { AppGeneratorSchema } from './schema';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';

interface NormalizedSchema extends AppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: AppGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

async function createUniversalApp(tree: Tree, options: NormalizedSchema) {
  const appGenerator = wrapAngularDevkitSchematic('@nrwl/angular', 'app');

  await appGenerator(tree, {
    name: options.name,
    style: 'scss',
    prefix: options.appPrefix,
    e2eTestRunner: 'cypress',
    routing: true,
    unitTestRunner: 'jest',
    strict: true,
    addTailwind: true,
    standaloneConfig: true,
  });

  // see https://blog.nrwl.io/server-side-rendering-ssr-with-angular-for-nx-workspaces-14e2414ca532
  const universalGenerator = wrapAngularDevkitSchematic(
    '@schematics/angular',
    'universal'
  );

  await universalGenerator(tree, {
    appId: options.name,
    project: options.name,
    skipInstall: false,
  });
}

function updateProjectConfiguration(tree: Tree, options: NormalizedSchema) {
  const app = readProjectConfiguration(tree, options.name);

  const rootPath = app.root;

  updateJson(tree, path.join(rootPath, 'project.json'), (value) => {
    // update outputPath for browser

    // TODO bug is here value.architect instead of value.targets
    value.targets.build.options.outputPath = `dist/apps/${options.name}/browser`;

    // update output for ssr
    value.targets.server.options.outputPath = `dist/apps/${options.name}/server`;

    return value;
  });
}

export default async function (tree: Tree, options: AppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  await createUniversalApp(tree, normalizedOptions);

  updateProjectConfiguration(tree, normalizedOptions);

  await formatFiles(tree);
}
