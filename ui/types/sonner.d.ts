declare module "sonner" {
  export type ToasterProps = Record<string, unknown>;
  export function Toaster(props: ToasterProps): JSX.Element;
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    message: (message: string) => void;
  };
}

