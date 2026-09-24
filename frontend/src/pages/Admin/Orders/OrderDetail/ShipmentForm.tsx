import { useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { Order } from "../../../../types/order";

const CARRIERS = [
  "DHL Express", "Delhivery", "BlueDart", "DTDC", "FedEx", "India Post",
  "Ecom Express", "XpressBees",
];

/**
 * Staff form to record the courier shipment (AWB + carrier). Saving marks the
 * order SHIPPED and queues the customer's "order shipped" email.
 */
function ShipmentForm({
  order,
  loading,
  onSubmit,
}: {
  order: Order;
  loading: boolean;
  onSubmit: (awb: string, carrierName?: string) => void;
}) {
  const [awb, setAwb] = useState(order.awb ?? "");
  const [carrier, setCarrier] = useState(order.carrierName ?? "");
  const done = Boolean(order.awb);

  return (
    <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
      <p className="eyebrow mb-2 flex items-center gap-1.5">
        <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} />
        Shipment tracking
      </p>
      {done && (
        <p className="mb-2 text-xs font-semibold text-state-success">
          ✓ {order.carrierName ?? "Courier"} · AWB {order.awb}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          className="input-control !w-auto min-w-0 flex-1"
          placeholder={done ? "Update AWB" : "AWB / tracking number"}
          value={awb}
          maxLength={40}
          onChange={(e) => setAwb(e.target.value)}
          aria-label="AWB tracking number"
        />
        <select
          className="input-control !w-auto"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          aria-label="Carrier"
        >
          <option value="">Carrier…</option>
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          {carrier && !CARRIERS.includes(carrier) && <option value={carrier}>{carrier}</option>}
        </select>
        <LoadingButton
          size="small"
          variant="contained"
          loading={loading}
          disabled={!awb.trim()}
          onClick={() => onSubmit(awb.trim(), carrier.trim() || undefined)}
        >
          {done ? "Update" : "Mark shipped"}
        </LoadingButton>
      </div>
      <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-muted">
        Saving sets the order to <b>Shipped</b> and emails the customer the tracking number.
        Later milestones: Out for delivery, Delivered (status control below).
      </p>
    </div>
  );
}

export default ShipmentForm;
