import Button from "./Button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ConfirmBadge
 *
 * A reusable confirmation modal component with motion animations.
 * Props:
 * - open: (bool) controls visibility
 * - title: (string or node) main message
 * - description: (string or node) optional second line
 * - confirmText: (string) text for confirm button
 * - cancelText: (string) text for cancel button
 * - onConfirm: (function) handler for confirm
 * - onCancel: (function) handler for cancel (also closes modal)
 * - loading: (bool) disables buttons and can show loading state
 * - confirmButtonProps: (object) additional props for confirm button
 * - cancelButtonProps: (object) additional props for cancel button
 * - children: (node) replaces description if present
 * - className: (string) add classes to the modal container
 */
export default function ConfirmBadge({
  open = false,
  icon = "",
  title = "Sei sicuro?",
  description = "Questa azione è irreversibile",
  confirmText = "Si",
  cancelText = "No",
  onConfirm,
  onCancel,
  loading = false,
  confirmButtonProps = {},
  cancelButtonProps = {},
  children,
  className = "",
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-100 bg-black/10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-bg min-w-80 min-h-40 rounded-md shadow-md flex items-center max-w-25 justify-between flex-col p-3 ${className}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            {title && (
              <div className="flex flex-col gap-2 items-center">
                {icon}
                <h1 className="font-bold text-xl text-center w-full flex items-center">
                  {title}
                </h1>
              </div>
            )}
            <div className="mt-2 mb-4 text-center w-full text-xs px-4">
              {children || (description && <p>{description}</p>)}
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Button
                size="md"
                onClick={onCancel}
                disabled={loading}
                {...cancelButtonProps}
              >
                {cancelText}
              </Button>
              <Button
                size="md"
                variant="primary"
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
                {...confirmButtonProps}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
