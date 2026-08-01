declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.mp3' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_QUOTES_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


