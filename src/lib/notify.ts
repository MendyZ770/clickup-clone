import { toast as shadcnToast } from "@/components/ui/use-toast";

type Options = { description?: string; duration?: number };

function emit(
  title: string,
  options: Options | undefined,
  variant: "default" | "destructive"
) {
  return shadcnToast({
    title,
    description: options?.description,
    variant,
    duration: options?.duration ?? 4000,
  });
}

/** API minimaliste compatible avec les composants déjà écrits, branchée sur le Toaster du projet. */
export const toast = {
  error: (title: string, options?: Options) => emit(title, options, "destructive"),
  success: (title: string, options?: Options) => emit(title, options, "default"),
  message: (title: string, options?: Options) => emit(title, options, "default"),
  info: (title: string, options?: Options) => emit(title, options, "default"),
  dismiss: () => shadcnToast({ title: "", duration: 1 }),
};
