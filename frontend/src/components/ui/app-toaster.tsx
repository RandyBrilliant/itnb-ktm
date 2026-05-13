import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand
      toastOptions={{
        duration: 3500,
        classNames: {
          toast:
            "border border-[#e8e8e8] bg-white text-[#1a1c1c] shadow-[0_10px_30px_rgba(0,0,0,0.12)]",
          title: "font-semibold text-sm",
          description: "text-xs text-[#5f5e5e]",
          success:
            "border-[#8dd8a5] bg-[#ecfdf3] text-[#0f5132]",
          error:
            "border-[#f2a9a9] bg-[#fef2f2] text-[#7f1d1d]",
          info:
            "border-[#9ec5fe] bg-[#eff6ff] text-[#1e3a8a]",
          warning:
            "border-[#f6d59a] bg-[#fffbeb] text-[#7c4a03]",
          loading:
            "border-[#d6d3d1] bg-[#fafaf9] text-[#44403c]",
          closeButton:
            "border-[#d6d3d1] bg-white text-[#5f5e5e] hover:bg-[#f5f5f5]",
        },
      }}
    />
  )
}
