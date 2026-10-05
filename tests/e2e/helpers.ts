import { BASE_PATH } from "../../site.config";

export function sitePath(path: string): string {
  return `${BASE_PATH}/${path.replace(/^\//, "")}`;
}
