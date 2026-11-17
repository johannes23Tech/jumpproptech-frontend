/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MARKETPLACE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
