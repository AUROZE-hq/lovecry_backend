'use client';

type ConfirmSubmitProps = {
  message: string;
  className?: string;
  children: React.ReactNode;
};

export default function ConfirmSubmit({ message, className, children }: ConfirmSubmitProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
