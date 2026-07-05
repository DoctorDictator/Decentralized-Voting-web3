import React from "react";
import { useWeb3 } from "../context/Web3Context";

const Toast = () => {
  const { toasts, removeToast } = useWeb3();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
