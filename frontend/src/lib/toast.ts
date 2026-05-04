import { toast as sonnerToast } from "sonner"

export const toast = {
  success: (title: string, description?: string) => {
    sonnerToast.success(title, {
      description,
    })
  },
  error: (title: string, description?: string) => {
    sonnerToast.error(title, {
      description,
    })
  },
  loading: (title: string, description?: string) => {
    return sonnerToast.loading(title, {
      description,
    })
  },
  info: (title: string, description?: string) => {
    sonnerToast(title, {
      description,
    })
  },
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}
