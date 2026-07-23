import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none touch-manipulation active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-md shadow-brand-900/12 hover:bg-brand-700",
        brand:
          "bg-brand-600 text-white shadow-lg shadow-brand-900/15 hover:bg-brand-700",
        outline:
          "border-border bg-background text-foreground hover:bg-muted/80 dark:border-input dark:bg-card/50",
        secondary:
          "border-brand-200/80 bg-white text-brand-800 hover:bg-brand-50 dark:border-brand-900/40 dark:bg-slate-900/30 dark:text-brand-300",
        ghost:
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-brand-600 underline-offset-4 hover:underline active:scale-100",
        whatsapp:
          "bg-[#25D366] text-white shadow-md hover:bg-[#20BD5A]",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm",
        sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
        lg: "h-12 gap-2 px-5 text-base",
        touch: "h-[52px] gap-2.5 px-5 text-base font-bold",
        icon: "size-10",
        "icon-sm": "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
