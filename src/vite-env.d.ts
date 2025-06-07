// src/vite-env.d.ts
/// <reference types="vite/client" />

// 扩展 ImportMetaEnv 接口，添加自定义环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_ENABLE_MOCK: string
  readonly VITE_ENABLE_TEST_CONSOLE: string
  readonly VITE_DEBUG_MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 确保这个文件被视为模块
export {}