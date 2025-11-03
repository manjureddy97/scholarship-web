import en from './en.json'
export const t = (key: string) => key.split('.').reduce((a:any,p)=>a?.[p], en)
