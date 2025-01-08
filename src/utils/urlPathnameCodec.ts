export const stringSlashToUrlPathname = (str: string) => {
  return str.replaceAll('/', '|')
}

export const urlPathnameToStringSlash = (str: string) => {
  return str.replaceAll('|', '/')
}
