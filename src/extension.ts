import { ExtensionContext, workspace, window, commands } from 'vscode';
import { paramCase } from 'change-case';
import { from, forkJoin } from 'rxjs';
import { concatMap, filter, first, tap } from 'rxjs/operators';

import { FileHelper, logger } from './helpers';

export function activate(context: ExtensionContext) {
  const createComponent = (uri, type: string, extension: string) => {
    let enterComponentNameDialog$ = from(
      window.showInputBox({
        prompt: 'Enter the file name:',
      }),
    );

    enterComponentNameDialog$
      .pipe(
        concatMap((val) => {
          if (val.length === 0) {
            logger('error', 'Component name can not be empty!');
            throw new Error('Component name can not be empty!');
          }
          let componentName = paramCase(val);
          let componentFileName = FileHelper.getComponentFileName(componentName);
          let componentDir = FileHelper.createDirectory(uri, componentFileName);
          let testDir = componentDir;

          if (type === 'app-component' || type === 'app-flow') {
            testDir = FileHelper.createDirectory(uri, `${componentFileName}/__tests__`);
          }

          let steps = [
            FileHelper.createComponentFile(componentDir, componentName, type, extension),
            FileHelper.createSpecFile(testDir, componentName, type, extension),
          ];

          if (type !== 'app-flow') {
            steps.push(FileHelper.createIndexFile(componentDir, componentName, type, extension));
          }

          steps.push(FileHelper.createStyledFile(componentDir, componentName, extension));

          return forkJoin(steps);
        }),
        concatMap((result) => from(result)),
        filter((path) => path.length > 0),
        first(),
        concatMap((filename) => from(workspace.openTextDocument(filename))),
        concatMap((textDocument) => {
          if (!textDocument) {
            logger('error', 'Could not open file!');
            throw new Error('Could not open file!');
          }
          return from(window.showTextDocument(textDocument));
        }),
        tap((editor) => {
          if (!editor) {
            logger('error', 'Could not open file!');
            throw new Error('Could not open file!');
          }
        }),
      )
      .subscribe(
        (c) => logger('success', 'Component successfully created!'),
        (err) => logger('error', err.message),
      );
  };

  const componentArray = [
    { type: 'commons-component', extension: 'js', commandId: 'extension.generateCommonsComponent' },
    { type: 'app-component', extension: 'tsx', commandId: 'extension.generateAppComponent' },
    { type: 'app-flow', extension: 'tsx', commandId: 'extension.generateAppFlowComponent' },
  ];

  componentArray.forEach((c) => {
    const disposable = commands.registerCommand(c.commandId, (uri) =>
      createComponent(uri, c.type, c.extension),
    );
    context.subscriptions.push(disposable);
  });
}

export function deactivate() {
  // No op
}
