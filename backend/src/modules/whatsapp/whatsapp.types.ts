export type WhatsappDestino = {
  id: number;
  numero: string;
  created_at: string;
};

export type WhatsappEstado = {
  activa: boolean;
  qr: string | null;
};

export type CrearDestinoInput = {
  numero: string;
};
