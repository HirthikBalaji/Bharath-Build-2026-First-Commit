import QRCode from 'qrcode';

export class TicketQRService {
  /**
   * Generates a data URL for QR code containing verified digital ticket info
   */
  static async generateQRCode(ticketData: {
    ticketId: string;
    operator: string;
    busNumber: string;
    route: string;
    date: string;
    seat: string;
    passengerName: string;
    status: string;
  }): Promise<string> {
    const payload = JSON.stringify({
      app: 'SeatRelay',
      tId: ticketData.ticketId,
      op: ticketData.operator,
      seat: ticketData.seat,
      pax: ticketData.passengerName,
      status: ticketData.status,
      v: 1
    });

    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  }
}
