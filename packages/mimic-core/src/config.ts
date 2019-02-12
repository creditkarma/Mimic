/**
 * @module @creditkarma/mimic-core
 */

import * as fs from "fs";
import { homedir } from "os";
import * as path from "path";
import { ensureDirectory, IUniq } from "./utils";

// Initial values
const configDir = path.join(homedir(), ".Mimic");

/**
 * Read and parse file from config directory
 *
 * @param {string} filePath file path relatively to config root
 */
export const readConfig = (filePath: string) =>
  new Promise<any>((resolve) => {
    const parse = filePath.endsWith(".json");
    fs.readFile(path.join(configDir, filePath), "utf8", (readErr, data) => {
      if (readErr) { return resolve(); }
      resolve(parse ? JSON.parse(data) : data);
    });
  });

/**
 * Read and parse files from config directory
 *
 * @param {string} folder folder path relatively to config root
 */
export const readConfigFolder = (folder: string) =>
  new Promise<IUniq<any>>((resolve) => {
    fs.readdir(path.join(configDir, folder), (err, files) => {
      const result: IUniq<any> = {};
      if (err) { return resolve(result); }
      const jsonFiles = files.map((f) => path.join(folder, f));
      Promise.all(jsonFiles.map((f) => readConfig(f))).then((values) => {
        jsonFiles.forEach((file, index) => {
          result[path.basename(file, path.extname(file))] = values[index];
        });
        resolve(result);
      });
    });
  });

/**
 * Write file into config folder and create parent directory if necessary
 * @param {string} filePath file path relatively to config root
 * @param {string} data data to store in config
 */
export const writeConfig = (filePath: string, data: any) =>
  new Promise((resolve, reject) => {
    const fullPath = path.join(configDir, filePath);
    const stringify = fullPath.endsWith(".json");
    ensureDirectory(path.dirname(fullPath), (dirErr) => {
      if (dirErr) { return reject(dirErr); }
      fs.writeFile(fullPath, stringify ? JSON.stringify(data, null, 2) : data, (writeErr) => {
        writeErr ? reject(writeErr) : resolve();
      });
    });
  });

/**
 * Write files into config folder and create parent directory if necessary
 * @param {string} filePath file path relatively to config root
 * @param {string} data data to store in config files
 * @param {string} ext file extensions to create
 */
export const writeConfigFolder = (folder: string, data: IUniq<any>, ext = "json") =>
  new Promise((resolve, reject) => {
    ensureDirectory(path.join(configDir, folder), (dirErr) => {
      if (dirErr) { return reject(dirErr); }
      Promise.all(Object.entries(data).map(([key, value]) =>
        writeConfig(path.join(folder, `${key}.${ext}`), value))).then(resolve, reject);
    });
  });

/**
 * Delete file from config directory
 *
 * @param {string} filePath file path relatively to config root
 */
export const deleteConfig = (filePath: string) =>
  new Promise((resolve, reject) => {
    fs.unlink(path.join(configDir, filePath), (rmErr) => {
      rmErr ? reject(rmErr) : resolve();
    });
  });

/**
 * Delete all files in config directory
 *
 * @param {string} folder folder path relatively to config root
 */
export const emptyConfigFolder = (folder: string) =>
  new Promise((resolve, reject) => {
    fs.readdir(path.join(configDir, folder), (err, files) => {
      if (err && err.code === "ENOENT") { return resolve(); }
      if (err) { return reject(err); }
      Promise.all(files.map((file) => deleteConfig(path.join(folder, file)))).then(resolve, reject);
    });
  });
