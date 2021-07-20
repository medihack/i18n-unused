import { writeFileSync } from 'fs';

import { RunOptions, UnusedCollect } from '../types';

import { initialize } from '../helpers/initialize';
import { collectUnusedTranslations } from '../helpers/translations';
import { generateFilesPaths } from '../helpers/files';
import { applyToFlatKey } from '../helpers/action';
import { checkUncommittedChanges } from '../helpers/git';

import { GREEN } from '../helpers/consoleColor';

export const removeUnusedTranslations = async (options: RunOptions): Promise<UnusedCollect> => {
  const config = await initialize(options);

  const localesFilesPaths = await generateFilesPaths(
    config.localesPath,
    ['json'] // @TODO implement other types when add other types writes
  );

  const unusedTranslationsCollect = await collectUnusedTranslations(
    localesFilesPaths,
    `${process.cwd()}/${config.srcPath}`,
    config.extensions,
    config.localeModuleResolver,
    config.excludeKey,
  );

  if (config.gitCheck) {
    checkUncommittedChanges();
  }

  unusedTranslationsCollect.forEach((collect) => {
    const locale = require(collect.path);

    collect.keys.forEach((key) => applyToFlatKey(locale, key, (source, lastKey) => {
      delete source[lastKey];
    }));

    writeFileSync(collect.path, JSON.stringify(locale, null, 2));

    console.log(GREEN, `Successfully removed: ${collect.path}`);
  });

  return unusedTranslationsCollect;
};
