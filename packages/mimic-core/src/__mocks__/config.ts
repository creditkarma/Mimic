import { IUniq } from "../utils";

let mockFiles: IUniq<any> = {};
const mockFolders: IUniq<IUniq<any>> = {};

export const setMockFiles = (files: IUniq<any>) => mockFiles = {...mockFiles, ...files};

export const setMockFolder = (folder: string, files: IUniq<any>) => mockFolders[folder] = files;

export const readConfig = (filePath: string) => Promise.resolve(mockFiles[filePath]);

export const readConfigFolder = (folder: string) => Promise.resolve(mockFolders[folder]);

export const writeConfig = (filePath: string, data: any) => Promise.resolve();

export const writeConfigFolder = (folder: string, data: IUniq<any>) => Promise.resolve();

export const deleteConfig = (filePath: string) => Promise.resolve();

export const emptyConfigFolder = (folder: string) => Promise.resolve();
