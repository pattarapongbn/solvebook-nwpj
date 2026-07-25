export type PaymentStatus =
  | "awaiting_payment"
  | "slip_submitted"
  | "paid"
  | "refunded"
  | "cancelled";

export type FulfillmentStatus = "pending" | "ready_to_ship" | "shipped" | "cancelled";

export type SlipCheckStatus = "qr_ok" | "duplicate" | "qr_unreadable";

export interface ShippingSnapshot {
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  tambon: string;
  tambon_code: string;
  amphoe: string;
  amphoe_code: string;
  province: string;
  province_code: string;
  zipcode: string;
  delivery_note: string;
}

export interface Slip {
  id: number;
  check_status: SlipCheckStatus;
  transaction_ref: string | null;
  sending_bank: string | null;
  image_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: number;
  amount_base: string;
  amount_due: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  tracking_no: string | null;
  paid_at: string | null;
  created_at: string;
  shipping_snapshot: ShippingSnapshot;
  slips: Slip[];
}

export interface Address {
  id: number;
  label: string | null;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  tambon: string;
  tambon_code: string | null;
  amphoe: string;
  amphoe_code: string | null;
  province: string;
  province_code: string | null;
  zipcode: string;
  delivery_note: string | null;
  is_default: boolean;
}

export interface Customer {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  total_orders: number;
  total_spent: string;
  flags: string[];
  first_order_at: string | null;
  last_order_at: string | null;
  created_at: string;
  addresses: Address[];
}

export interface UnmatchedPayment {
  id: number;
  amount: string;
  received_at: string;
  raw_message: string | null;
  resolved_order_id: number | null;
  created_at: string;
}
