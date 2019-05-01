import { workspace, window } from 'vscode';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { pascalCase, paramCase } from 'change-case';
import { Observable, bindNodeCallback } from 'rxjs';
import { map } from 'rxjs/operators';

export class FileHelper {
  private static assetRootDir: string = path.join(__dirname, '../../assets');

  private static createFile = <(file: string, data: string) => Observable<{}>>(
    bindNodeCallback(fse.outputFile)
  );

  public static createDirectory(uri: any, dirName: string): string {
    let contextMenuSourcePath;

    if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
      contextMenuSourcePath = uri.fsPath;
    } else if (uri) {
      contextMenuSourcePath = path.dirname(uri.fsPath);
    } else {
      contextMenuSourcePath = workspace.rootPath;
    }

    let componentDir = `${contextMenuSourcePath}/${dirName}`;
    return componentDir;
  }

  public static createComponentFile(
    componentDir: string,
    componentName: string,
    type: string,
    extension: string,
  ): Observable<string> {
    let templateFileName = this.assetRootDir + `/templates/${type}.template`;
    let prefix = type === 'commons-component' ? 'SFUI' : '';
    let suffix = type === 'app-flow' ? 'flow' : 'component';

    const compName = this.getComponentName(componentName);
    const prefixedCompName = `${prefix}${this.getComponentName(componentName)}`;
    const compFileName = this.getComponentFileName(componentName);

    let componentContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{prefixedComponentName}/g, prefixedCompName)
      .replace(/{componentName}/g, compName)
      .replace(/{componentFileName}/g, compFileName);

    let filename = `${componentDir}/${compFileName}.${suffix}.${extension}`;
    return this.createFile(filename, componentContent).pipe(map(() => filename));
  }

  public static createSpecFile(
    componentDir: string,
    componentName: string,
    type: string,
    extension: string,
  ): Observable<string> {
    let templateFileName = this.assetRootDir + `/templates/${type}-spec.template`;
    let prefix = type === 'commons-component' ? 'SFUI' : '';
    let suffix = type === 'app-flow' ? 'flow' : 'component';

    const compName = this.getComponentName(componentName);
    const prefixedCompName = `${prefix}${this.getComponentName(componentName)}`;
    const compFileName = this.getComponentFileName(componentName);

    let componentContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{prefixedComponentName}/g, prefixedCompName)
      .replace(/{componentName}/g, compName)
      .replace(/{componentFileName}/g, `${this.getComponentFileName(componentName)}.${suffix}`);

    let filename = `${componentDir}/${compFileName}.${suffix}.spec.${extension}`;
    return this.createFile(filename, componentContent).pipe(map(() => filename));
  }

  public static createIndexFile(
    componentDir: string,
    componentName: string,
    type: string,
    extension: string,
  ): Observable<string> {
    let templateFileName = this.assetRootDir + '/templates/index.template';
    let prefix = type === 'commons-component' ? 'SFUI' : '';

    const compName = this.getComponentName(componentName);
    const prefixedCompName = `${prefix}${this.getComponentName(componentName)}`;
    const compFileName = `${this.getComponentFileName(componentName)}.component`;

    let indexContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{prefixedComponentName}/g, prefixedCompName)
      .replace(/{componentName}/g, compName)
      .replace(/{componentFileName}/g, compFileName);

    let filename = `${componentDir}/index.${extension.replace('x', '')}`;
    return this.createFile(filename, indexContent).pipe(map(() => filename));
  }

  public static createStyledFile(
    componentDir: string,
    componentName: string,
    extension: string,
  ): Observable<string> {
    let templateFileName = `${this.assetRootDir}/templates/styled.template`;

    const compName = this.getComponentName(componentName);
    const compFileName = this.getComponentFileName(componentName);

    let cssContent = fs
      .readFileSync(templateFileName)
      .toString()
      .replace(/{componentName}/g, compName);

    let filename = `${componentDir}/${compFileName}.styled.${extension}`;
    return this.createFile(filename, cssContent).pipe(map(() => filename));
  }

  public static getComponentName = (name: string) => pascalCase(name);
  public static getComponentFileName = (name: string) => paramCase(name);
}

export function logger(type: 'success' | 'warning' | 'error', msg: string) {
  switch (type) {
    case 'success':
      return window.setStatusBarMessage(`Success: ${msg}`, 3000);
    case 'warning':
      return window.showWarningMessage(`Warning: ${msg}`);
    case 'error':
      return window.showErrorMessage(`Failed: ${msg}`);
  }
}
