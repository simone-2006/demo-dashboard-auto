import { toast } from "react-toastify";
import { Trash2, CircleCheckBig, CircleX, Info, TriangleAlert } from "lucide-react";

export function toastSuccess(message) {
    toast.success(message, {
        icon: <CircleCheckBig size={20} className="text-success"/>
    });
}

export function toastError(message) {
    toast.error(message, {
        icon: <CircleX size={20} className="text-critical"/>
    });
}

export function toastDeleted(message) {
    toast.error(message, {
        icon: <Trash2 size={20} className="text-critical"/>
    });
}

export function toastInfo(message) {
    toast.info(message, {
        icon: <Info size={20} className="text-brand"/>
    });
}

export function toastWarning(message) {
    toast.warning(message, {
        icon: <TriangleAlert size={20} className="text-warning"/>
    });
}
