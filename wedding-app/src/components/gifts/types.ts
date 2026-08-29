export interface GiftView {
  id: string;
  guest_id: string | null;
  guest_name: string | null;
  giver_name: string | null;
  gift_type: string;
  description: string | null;
  value: number | null;
  received_at: string | null;
  thank_you_sent: boolean;
  thank_you_sent_at: string | null;
}
