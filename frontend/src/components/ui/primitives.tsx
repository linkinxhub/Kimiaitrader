import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-glow hover:opacity-95",
        secondary: "border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800/80",
        ghost: "bg-transparent text-slate-300 hover:bg-slate-900/80",
        danger: "bg-red-500/20 text-red-200 hover:bg-red-500/30",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-card backdrop-blur", className)} {...props} />;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300", className)}>{children}</span>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-[120px] w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-blue-500", className)} {...props}>{children}</select>;
}

export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border border-slate-700 transition",
        checked ? "bg-blue-500" : "bg-slate-800",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white transition", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "text-blue-300",
  helper,
}: {
  label: string;
  value: string;
  tone?: string;
  helper?: string;
}) {
  return (
    <Card className="space-y-2">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className={cn("font-display text-3xl font-semibold", tone)}>{value}</p>
      {helper ? <p className="text-sm text-slate-400">{helper}</p> : null}
    </Card>
  );
}
