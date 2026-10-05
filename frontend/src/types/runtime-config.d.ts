interface FlowComRuntimeConfig {
  apiUrl: string;
  socketUrl: string;
}

declare global {
  interface Window {
    __FLOWCOM_CONFIG__?: Partial<FlowComRuntimeConfig>;
  }
}

export {};
