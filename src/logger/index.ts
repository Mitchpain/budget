import * as fs from "fs";

let path = "";

const init = async (project: string, logFolder: string) => {
  const today = new Date();
  path = `${logFolder}log_${project}_${today.getFullYear()}_${
    today.getMonth() + 1
  }_${today.getDate()}.log`;
  await fs.promises.writeFile(path, "Logger for : " + project);
};

const write = (message: string) => {
  if (!!path) return;
  fs.promises.appendFile(path, `\n${message}`);
};

const error = (message: string) => {
  if (!!path) return;
  write(`Error: ${message}`);
};

export const logger = {
  write,
  init,
  error,
};
