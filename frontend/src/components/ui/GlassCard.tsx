import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{ 
  className?: string; 
  as?: keyof JSX.IntrinsicElements;
  variant?: 'default' | 'strong' | 'muted';
}>;

export default function GlassCard({ 
  children, 
  className = "", 
  as: Tag = "div",
  variant = 'default' 
}: Props) {
  const variantClass = variant === 'strong' ? 'glass-strong' : variant === 'muted' ? 'glass-muted' : 'glass';
  
  return (
    <Tag className={`${variantClass} rounded-2xl p-4 md:p-6 ${className}`}>
      {children}
    </Tag>
  );
}
