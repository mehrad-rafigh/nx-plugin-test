import {createTreeWithEmptyWorkspace} from '@nrwl/devkit/testing';
import {readProjectConfiguration, Tree} from '@nrwl/devkit';

import generator from './generator';
import {AppGeneratorSchema} from './schema';

describe('app generator', () => {
  let appTree: Tree;
  const options: AppGeneratorSchema = { name: 'test', appPrefix: 'my-app' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);
    const config = readProjectConfiguration(appTree, options.name);
    expect(config).toBeDefined();
  });
});
